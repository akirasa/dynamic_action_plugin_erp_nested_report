/**
 * ERP Nested Grid Plugin for Oracle APEX
 * Universal All-in-One Engine (Normal, Control Break, Aggregates, RTL)
 */
(function (window, $, apex) {
    "use strict";

    window.erpNestedGrid = window.erpNestedGrid || {};
    var NG = window.erpNestedGrid;

    // دالة تنظيف ومطابقة النصوص (تدعم العربية والإنجليزية معاً)
    function normalize(val) {
        if (val === undefined || val === null) return "";
        return String(val)
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    // جلب قيم الصفحة تلقائياً
    NG.getAllPageItems = function () {
        var pageItems = {};
        $('[id^="P' + apex.env.APP_PAGE_ID + '_"]').each(function () {
            var itemId = this.id;
            if (itemId && !itemId.includes("_CONTAINER") && !itemId.includes("_LABEL")) {
                try {
                    var item = apex.item(itemId);
                    if (item && item.getValue) {
                        var val = item.getValue();
                        if (val !== undefined && val !== null) {
                            pageItems[itemId.toUpperCase()] = Array.isArray(val) ? val.join(":") : String(val);
                        }
                    }
                } catch (e) {}
            }
        });
        return pageItems;
    };

    // اكتشاف خلية الربط في كل السيناريوهات
    NG.findRowKeyCell = function ($row, rowKeyName) {
        var $cells = $row.children("td");
        if (!$cells.length) return $();

        var $table = $row.closest("table");
        var targetKey = normalize(rowKeyName);
        if (!targetKey) return $cells.first();

        // 1. الفحص المباشر في headers الخلية (حالة الكنترول بريك)
        var $directMatch = $cells.filter(function () {
            var h = normalize($(this).attr("headers"));
            return h === targetKey || h.split(/\s+/).indexOf(targetKey) !== -1;
        }).first();

        if ($directMatch.length) return $directMatch;

        // 2. الفحص في رؤوس الجدول th ومطابقة الـ ID (حالة التقرير العادي والمجاميع)
        var matchedHeaderId = null;
        var matchedColIdx = -1;

        $table.find("th").each(function (idx) {
            if (matchedHeaderId) return;

            var $th = $(this);
            var candidates = [
                $th.attr("data-apex-col"),
                $th.attr("data-column"),
                $th.attr("data-column-name"),
                $th.attr("id"),
                $th.find("[data-apex-col]").attr("data-apex-col"),
                $th.find("[data-column]").attr("data-column"),
                $th.clone().children().remove().end().text(),
                $th.text()
            ];

            for (var i = 0; i < candidates.length; i++) {
                var c = normalize(candidates[i]);
                if (c && (c === targetKey || c.indexOf(targetKey) !== -1 || targetKey.indexOf(c) !== -1)) {
                    matchedHeaderId = $th.attr("id");
                    matchedColIdx = idx;
                    break;
                }
            }
        });

        if (matchedHeaderId) {
            var $byHeader = $cells.filter(function () {
                var h = String($(this).attr("headers") || "").split(/\s+/);
                return h.indexOf(matchedHeaderId) !== -1;
            }).first();

            if ($byHeader.length) return $byHeader;
        }

        // 3. المطابقة عبر الترتيب (Index)
        if (matchedColIdx >= 0 && matchedColIdx < $cells.length) {
            return $cells.eq(matchedColIdx);
        }

        // 4. خطة الأمان: اختيار أول خلية بيانات حقيقية وتجاوز أعمدة الروابط والأيقونات
        var $fallback = $cells.filter(function () {
            var $td = $(this);
            var txt = $td.clone().children().remove().end().text().trim();
            return txt !== "" && !$td.find("a.a-IRR-link, button, .fa, .t-Icon").length;
        }).first();

        return $fallback.length ? $fallback : $cells.first();
    };

    NG.parseConfig = function (action) {
        return {
            sql: action.attribute01 ? String(action.attribute01).trim() : null,
            targetIR: action.attribute02 ? String(action.attribute02).trim() : null,
            rowKey: action.attribute03 ? String(action.attribute03).trim() : "REQ_ID",
            title: action.attribute05 ? String(action.attribute05).trim() : "الحركات التفصيلية",
            style: action.attribute06 ? String(action.attribute06).trim() : "STRIPED",
            enableSearch: action.attribute07 !== "N",
            rtl: action.attribute08 !== "N",
            ajaxIdentifier: action.ajaxIdentifier
        };
    };

    NG.execute = function () {
        var action = this.action;
        var config = NG.parseConfig(action);

        if (!config.sql) return;

        var initGrid = function () {
            var $table = config.targetIR ? $("#" + config.targetIR).find("table.a-IRR-table") : $("table.a-IRR-table");
            if (!$table.length) {
                $table = $("table.t-Report-report, table").not(".SUB_TABLE_GRID").first();
            }

            if ($table.length) {
                NG.initRows($table, config);
            }
        };

        // تنفيذ فوري ومعالجة التأخير
        initGrid();
        setTimeout(initGrid, 150);
        setTimeout(initGrid, 450);

        // التحديث التلقائي عند: الفلترة، التقليب، إضافة أو إزالة كنترول بريك، أو تجميع
        $(document).off("apexafterrefresh.lvl2_ng").on("apexafterrefresh.lvl2_ng", function () {
            setTimeout(initGrid, 100);
        });
    };

    // معالجة كافة الصفوف وفلترة أسطر البيانات الحقيقية
    NG.initRows = function ($table, config) {
        // فلترة دقيقة: استبعاد العناوين، الكنترول بريك، أسطر التجميع، والرسائل الفارغة
        var $rows = $table.find("tbody > tr, tr").filter(function () {
            var $tr = $(this);

            var isExcluded = $tr.hasClass("SUB_TABLE_HOST_ROW") ||
                             $tr.hasClass("a-IRR-controlBreak") ||
                             $tr.hasClass("a-IRR-aggregate") ||
                             $tr.hasClass("a-IRR-noData") ||
                             $tr.hasClass("a-IRR-group") ||
                             $tr.find(".a-IRR-aggregate-value").length > 0 ||
                             $tr.find(".a-IRR-noDataMsg, .a-IRR-noData-message").length > 0 ||
                             $tr.closest(".lvl2-row-container").length > 0 ||
                             $tr.children("th").length > 0 ||
                             $tr.children("td").length <= 1;

            return !isExcluded;
        });

        $rows.each(function () {
            var $row = $(this);
            if ($row.find(".SUB_TABLE_EXPAND_BTN").length) return;

            var $targetCell = NG.findRowKeyCell($row, config.rowKey);
            if (!$targetCell.length) return;

            var rawVal = $targetCell.clone().children().remove().end().text().replace(/\u00a0/g, " ").trim();
            if (!rawVal) {
                rawVal = $targetCell.find("a").first().text().trim();
            }

            // التحقق من صلاحية القيمة (استبعاد القيم الفارغة ونصوص المجاميع)
            if (!rawVal || rawVal === "-" || rawVal.toLowerCase() === "null" ||
                /^(مجموع|المجموع|إجمالي|الإجمالي|total|sum|count|avg)$/i.test(rawVal)) {
                return;
            }

            $row.data("sub-table-key", rawVal);

            var $btn = $(
                '<button type="button" class="SUB_TABLE_EXPAND_BTN" title="عرض التفاصيل">' +
                '<i class="fa fa-list-alt" aria-hidden="true"></i>' +
                '<span>عرض</span>' +
                '<i class="fa fa-chevron-right SUB_TABLE_ARROW_ICON" aria-hidden="true"></i>' +
                '</button>'
            );

            $targetCell.empty().css("text-align", "center").append($btn);

            $btn.on("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                NG.toggleRow($row, config, $btn);
            });
        });
    };

    NG.toggleRow = function ($row, config, $btn) {
        var $nextRow = $row.next(".SUB_TABLE_HOST_ROW");

        if ($nextRow.length) {
            $nextRow.toggle();
            var isOpen = $nextRow.is(":visible");
            $btn.toggleClass("is-active", isOpen);
            $row.toggleClass("SUB_TABLE_PARENT_ROW_ACTIVE", isOpen);
            return;
        }

        var colSpan = $row.children("td").length;
        var $detailRow = $(
            '<tr class="SUB_TABLE_HOST_ROW">' +
            '<td colspan="' + colSpan + '">' +
            '<div class="lvl2-row-container">' +
            '<div class="SUB_TABLE_CONTAINER">' +
            '<div class="SUB_TABLE_LOADING">' +
            '<span class="u-Processing-spinner"></span>' +
            '<span>جاري جلب التفاصيل...</span>' +
            '</div></div></div></td></tr>'
        );

        $row.after($detailRow);
        $btn.addClass("is-active");
        $row.addClass("SUB_TABLE_PARENT_ROW_ACTIVE");

        NG.loadData($row, $detailRow.find(".SUB_TABLE_CONTAINER"), config, $btn);
    };

    NG.loadData = function ($parentRow, $container, config, $btn) {
        var bindValues = NG.getAllPageItems();
        var rowId = $parentRow.data("sub-table-key");

        bindValues["REQ_ID"] = rowId;
        bindValues["REQID"] = rowId;
        if (config.rowKey) {
            bindValues[config.rowKey.toUpperCase()] = rowId;
        }

        apex.server.plugin(
            config.ajaxIdentifier,
            { x02: JSON.stringify(bindValues) },
            {
                success: function (data) {
                    if (data && data.success) {
                        NG.renderTable($container, data, config, $parentRow, $btn);
                    } else {
                        $container.html('<div class="SUB_TABLE_ERROR"><i class="fa fa-exclamation-triangle"></i> تعذر جلب البيانات.</div>');
                    }
                },
                error: function (xhr, status, error) {
                    $container.html('<div class="SUB_TABLE_ERROR"><i class="fa fa-plug"></i> فشل الاتصال: ' + error + '</div>');
                }
            }
        );
    };

    NG.renderTable = function ($container, data, config, $parentRow, $btn) {
        if (!data.rows || data.rows.length === 0) {
            $container.html(
                '<div class="SUB_TABLE_HEADER_RIBBON">' +
                '<div class="SUB_TABLE_TITLE_GROUP"><i class="fa fa-table"></i> ' + config.title + '</div>' +
                '<button type="button" class="SUB_TABLE_CTRL_BTN SUB_TABLE_CLOSE_BTN" title="إغلاق"><i class="fa fa-times"></i></button>' +
                '</div>' +
                '<div class="SUB_TABLE_EMPTY"><i class="fa fa-info-circle"></i> لا توجد حركات مسجلة لهذا السجل.</div>'
            );
            $container.find(".SUB_TABLE_CLOSE_BTN").on("click", function (e) {
                e.stopPropagation();
                NG.toggleRow($parentRow, config, $btn);
            });
            return;
        }

        var dir = config.rtl ? 'dir="rtl"' : 'dir="ltr"';
        var styleClass = "STYLE_" + config.style;
        var totalRows = data.rows.length;

        var html = '<div ' + dir + ' class="' + styleClass + '">';
        
        html += '<div class="SUB_TABLE_HEADER_RIBBON">';
        html += '<div class="SUB_TABLE_TITLE_GROUP">';
        html += '<i class="fa fa-th-list"></i> ' + config.title;
        html += '<span class="SUB_TABLE_BADGE"><i class="fa fa-check-circle"></i> <span class="SUB_TABLE_COUNT">' + totalRows + '</span> حركة</span>';
        html += '</div>';
        html += '<div class="SUB_TABLE_CONTROLS">';
        html += '<button type="button" class="SUB_TABLE_CTRL_BTN SUB_TABLE_RELOAD_BTN" title="تحديث"><i class="fa fa-refresh"></i></button>';
        html += '<button type="button" class="SUB_TABLE_CTRL_BTN SUB_TABLE_CLOSE_BTN" title="إغلاق"><i class="fa fa-times"></i></button>';
        html += '</div></div>';

        if (config.enableSearch) {
            html += '<div class="SUB_TABLE_SEARCH_BOX">';
            html += '<i class="fa fa-search"></i>';
            html += '<input type="text" class="SUB_TABLE_SEARCH_INPUT" placeholder="بحث سريع في التفاصيل...">';
            html += '</div>';
        }

        html += '<div class="SUB_TABLE_SCROLL">';
        html += '<table class="SUB_TABLE_GRID">';
        html += '<thead><tr>';
        data.columns.forEach(function (col) {
            html += '<th class="SUB_TABLE_TH">' + (col.label || col.name) + '</th>';
        });
        html += '</tr></thead><tbody>';

        data.rows.forEach(function (row) {
            html += '<tr class="SUB_TABLE_ROW">';
            row.forEach(function (val) {
                html += '<td class="SUB_TABLE_TD">' + (val !== null ? val : "-") + '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';

        $container.html(html);

        if (config.enableSearch) {
            $container.find(".SUB_TABLE_SEARCH_INPUT").on("keyup", function (e) {
                e.stopPropagation();
                var filter = $(this).val().toLowerCase();
                var visibleCount = 0;
                $container.find(".SUB_TABLE_GRID tbody tr").each(function () {
                    var text = $(this).text().toLowerCase();
                    var match = text.indexOf(filter) > -1;
                    $(this).toggle(match);
                    if (match) visibleCount++;
                });
                $container.find(".SUB_TABLE_COUNT").text(visibleCount);
            });
        }

        $container.find(".SUB_TABLE_RELOAD_BTN").on("click", function (e) {
            e.stopPropagation();
            $container.html('<div class="SUB_TABLE_LOADING"><span class="u-Processing-spinner"></span><span>جاري التحديث...</span></div>');
            NG.loadData($parentRow, $container, config, $btn);
        });

        $container.find(".SUB_TABLE_CLOSE_BTN").on("click", function (e) {
            e.stopPropagation();
            NG.toggleRow($parentRow, config, $btn);
        });
    };

})(window, apex.jQuery, apex);
