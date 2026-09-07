/**
 * ERP Nested Grid Plugin for Oracle APEX 24.2
 * Production Engine - Unified Architecture
 */
(function (window, $, apex) {
    "use strict";

    window.erpNestedGrid = window.erpNestedGrid || {};
    var NG = window.erpNestedGrid;

    // دالة توحيد وتنظيف النصوص لدعم العربية والإنجليزية معاً
    function normalizeText(val) {
        if (val === undefined || val === null) return "";
        return String(val)
            .replace(/\u00a0/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    // جلب قيم عناصر الصفحة التلقائية
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

    // اكتشاف الخلية المستهدفة بدقة متناهية
    NG.findRowKeyCell = function ($row, rowKeyName) {
        var $cells = $row.children("td");
        if (!$cells.length) return $();

        var $table = $row.closest("table");
        if (!$table.length) return $();

        var targetKey = normalizeText(rowKeyName);
        if (!targetKey) return $cells.first();

        // 1. البحث في جميع رؤوس الجدول (th) بدون قيد thead
        var matchedHeaderId = null;
        var matchedHeaderIndex = -1;

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
                $th.text()
            ];

            for (var i = 0; i < candidates.length; i++) {
                var candidate = normalizeText(candidates[i]);
                if (!candidate) continue;

                if (candidate === targetKey || candidate.indexOf(targetKey) !== -1 || targetKey.indexOf(candidate) !== -1) {
                    matchedHeaderId = $th.attr("id");
                    matchedHeaderIndex = idx;
                    break;
                }
            }
        });

        // 2. إذا وجدنا معرّف الرأس (Header ID)، نطابقه مع headers الخلية
        if (matchedHeaderId) {
            var $cellByHeader = $cells.filter(function () {
                var h = String($(this).attr("headers") || "").split(/\s+/);
                return h.indexOf(matchedHeaderId) !== -1;
            }).first();

            if ($cellByHeader.length) return $cellByHeader;
        }

        // 3. المطابقة المباشرة لنص المفتاح داخل headers
        var $cellByDirectHeaders = $cells.filter(function () {
            var h = normalizeText($(this).attr("headers"));
            return h === targetKey || h.indexOf(targetKey) !== -1;
        }).first();

        if ($cellByDirectHeaders.length) return $cellByDirectHeaders;

        // 4. المطابقة عبر رقم العمود (Index)
        if (matchedHeaderIndex >= 0 && matchedHeaderIndex < $cells.length) {
            return $cells.eq(matchedHeaderIndex);
        }

        // 5. خطة الإنقاذ: تجاوز أعمدة الروابط والأيقونات والبحث عن أول خلية بيانات صالحة
        var $candidate = $cells.filter(function () {
            var $td = $(this);
            var txt = $td.clone().children().remove().end().text().trim();
            return txt !== "" && !$td.find("a.a-IRR-link, button, .fa, .t-Icon").length;
        }).first();

        return $candidate.length ? $candidate : $cells.first();
    };

    // قراءة الإعدادات بربط صريح ومحكم
    NG.parseConfig = function (action) {
        var config = {
            sql: action.attribute01 ? String(action.attribute01).trim() : null,
            targetIR: action.attribute02 ? String(action.attribute02).trim() : null,
            rowKey: action.attribute03 ? String(action.attribute03).trim() : null,
            title: action.attribute05 ? String(action.attribute05).trim() : "الحركات التفصيلية",
            style: action.attribute06 ? String(action.attribute06).trim() : "STRIPED",
            enableSearch: action.attribute07 !== "N",
            rtl: action.attribute08 !== "N",
            ajaxIdentifier: action.ajaxIdentifier
        };

        // Fallback ذكي في حال كانت الخصائص مرتبة بنمط قديم
        if (!config.rowKey) {
            for (var i = 1; i <= 15; i++) {
                var k = "attribute" + (i < 10 ? "0" + i : i);
                var v = action[k] ? String(action[k]).trim() : null;
                if (!v) continue;
                if (!config.sql && /^(WITH|SELECT)\s+/i.test(v)) config.sql = v;
                else if (!config.rowKey && v.length < 35 && !/^(WITH|SELECT|\{|\})/i.test(v) && v !== "INLINE" && v !== "STRIPED" && v !== "COMPACT" && v !== "Y" && v !== "N") {
                    config.rowKey = v;
                }
            }
        }

        return config;
    };

    NG.execute = function () {
        var action = this.action;
        var config = NG.parseConfig(action);

        console.log("[ERP Nested Grid] Running with Config:", config);

        if (!config.sql) {
            console.error("[ERP Nested Grid] Aborted: SQL Query is missing.");
            return;
        }

        var initGrid = function () {
            var $table = config.targetIR ? $("#" + config.targetIR).find("table.a-IRR-table") : $("table.a-IRR-table");
            if (!$table.length) {
                $table = $("table.t-Report-report, table").not(".SUB_TABLE_GRID").first();
            }

            if ($table.length) {
                NG.initRows($table, config);
            }
        };

        initGrid();
        setTimeout(initGrid, 200);

        // إعادة التهيئة بعد التحديث (Pagination / Filtering / Control Break)
        $(document).off("apexafterrefresh.lvl2_ng").on("apexafterrefresh.lvl2_ng", function () {
            setTimeout(initGrid, 100);
        });
    };

    // معالجة صفوف التقرير
    NG.initRows = function ($table, config) {
        var $rows = $table.find("tbody > tr, tr").filter(function () {
            var $tr = $(this);
            return !$tr.hasClass("SUB_TABLE_HOST_ROW") &&
                   !$tr.hasClass("a-IRR-controlBreak") &&
                   $tr.closest(".lvl2-row-container").length === 0 &&
                   $tr.children("th").length === 0 &&
                   $tr.children("td").length > 1;
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

            if (!rawVal || rawVal === "-" || rawVal.toLowerCase() === "null") return;

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

        // تمرير المفتاح بجميع الاحتمالات
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
                '<div class="SUB_TABLE_EMPTY"><i class="fa fa-info-circle"></i> لا توجد بيانات مسجلة لهذا السجل.</div>'
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
            html += '<input type="text" class="SUB_TABLE_SEARCH_INPUT" placeholder="بحث سريع في النتائج...">';
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
