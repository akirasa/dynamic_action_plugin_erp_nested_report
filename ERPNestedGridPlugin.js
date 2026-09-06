(function (window, $, apex) {
    "use strict";

    window.erpNestedGrid = window.erpNestedGrid || {};
    var NG = window.erpNestedGrid;

    // جلب كافة قيم الصفحة تلقائياً لتغذية البايند فاريابلز (:P1_X)
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

    NG.getRegion = function (staticId) {
        if (!staticId) return $();
        try {
            var r = apex.region(staticId);
            if (r && r.element) return $(r.element);
        } catch (e) {}
        return $("#" + staticId);
    };

    NG.findRowKeyCell = function ($row, rowKeyName) {
        if (!rowKeyName) return $row.children("td").first();
        var targetKey = rowKeyName.toUpperCase();

        var $cell = $row.children("td").filter(function () {
            var h = ($(this).attr("headers") || "").toUpperCase();
            return h === targetKey || h.indexOf(targetKey) > -1;
        });
        if ($cell.length) return $cell.first();

        var cellIndex = -1;
        $row.closest("table").children("thead").find("th").each(function (idx) {
            var thId = ($(this).attr("id") || "").toUpperCase();
            var thText = $(this).text().trim().toUpperCase();
            if (thId === targetKey || thText === targetKey) {
                cellIndex = idx;
                return false;
            }
        });

        if (cellIndex !== -1 && $row.children("td").eq(cellIndex).length) {
            return $row.children("td").eq(cellIndex);
        }
        return $row.children("td").first();
    };

    // تحليل الإعدادات بمرونة تامة (يدعم الترتيب القديم والجديد)
    NG.parseConfig = function (action) {
        var config = {
            sql: action.attribute01,
            targetIR: null,
            rowKey: null,
            title: "الحركات التفصيلية",
            style: "STRIPED",
            enableSearch: true,
            rtl: true,
            ajaxIdentifier: action.ajaxIdentifier
        };

        for (var i = 1; i <= 15; i++) {
            var key = "attribute" + (i < 10 ? "0" + i : i);
            var val = action[key] ? String(action[key]).trim() : null;
            if (!val) continue;

            if (/^(WITH|SELECT)\s+/i.test(val)) {
                config.sql = val;
            } else if (val === "COMPACT" || val === "STRIPED" || val === "DEFAULT") {
                config.style = val;
            } else if (val === "N" && (i === 8 || i === 9 || i === 10)) {
                config.enableSearch = false;
            } else if (!config.targetIR && ($("#" + val).length || apex.region(val))) {
                config.targetIR = val;
            } else if (!config.rowKey && val.length > 0 && val.length < 40 && !val.startsWith("{") && !val.startsWith("[")) {
                if (val !== config.targetIR && val !== "INLINE" && val !== "POPUP" && val !== "Y" && val !== "N") {
                    config.rowKey = val;
                }
            }
        }

        if (!config.targetIR) {
            config.targetIR = $(".a-IRR-region, .t-Region--reportsTable").first().attr("id");
        }
        return config;
    };

    NG.execute = function () {
        var action = this.action;
        var config = NG.parseConfig(action);

        if (!config.sql) {
            console.warn("[ERP Nested Grid] SQL Query is missing in Dynamic Action.");
            return;
        }

        var initGrid = function () {
            var $region = NG.getRegion(config.targetIR);
            if (!$region.length) $region = $(".a-IRR-table").closest(".t-Region");
            if (!$region.length) $region = $(".t-Region");

            if ($region.length) {
                NG.initRows($region, config);

                $region.off("apexafterrefresh.lvl2_ng").on("apexafterrefresh.lvl2_ng", function () {
                    setTimeout(function () { NG.initRows($region, config); }, 70);
                });
            }
        };

        initGrid();
    };

    NG.initRows = function ($region, config) {
        var $mainTable = $region.find(".a-IRR-table").first();
        if (!$mainTable.length) {
            $mainTable = $region.find("table.t-Report-report, table").not(".SUB_TABLE_GRID").first();
        }
        if (!$mainTable.length) return;

        var $rows = $mainTable.children("tbody").children("tr").filter(function () {
            var $tr = $(this);
            var isSummary = $tr.hasClass("a-IRR-controlBreak") || 
                            $tr.hasClass("a-IRR-aggregate") || 
                            $tr.hasClass("a-IRR-group") || 
                            $tr.hasClass("SUB_TABLE_HOST_ROW") ||
                            $tr.find(".a-IRR-aggregate-value").length > 0;

            return !isSummary &&
                   $tr.closest(".lvl2-row-container").length === 0 &&
                   $tr.find("th").length === 0 &&
                   $tr.children("td").length > 1;
        });

        $rows.each(function () {
            var $row = $(this);
            if ($row.find(".SUB_TABLE_EXPAND_BTN").length) return;

            var $targetCell = NG.findRowKeyCell($row, config.rowKey);
            if (!$targetCell.length) return;

            var rawVal = $targetCell.text().replace(/\u00a0/g, " ").trim();
            if (!rawVal || rawVal === "" || rawVal === "-" || rawVal === "null") return;

            $row.data("sub-table-key", rawVal);

            var $btn = $(
                '<button type="button" class="SUB_TABLE_EXPAND_BTN" title="عرض التفاصيل">' +
                '<i class="fa fa-folder-open-o" aria-hidden="true"></i>' +
                '<span>عرض</span>' +
                '<i class="fa fa-chevron-right SUB_TABLE_ARROW_ICON" aria-hidden="true"></i>' +
                '</button>'
            );

            $targetCell.empty().css("text-align", "center").append($btn);

            $btn.on("click", function (e) {
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
        // جمع كل متغيرات الصفحة تلقائياً
        var bindValues = NG.getAllPageItems();

        var rowId = $parentRow.data("sub-table-key");
        if (config.rowKey && rowId !== undefined && rowId !== null) {
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
        
        // شريط العنوان
        html += '<div class="SUB_TABLE_HEADER_RIBBON">';
        html += '<div class="SUB_TABLE_TITLE_GROUP">';
        html += '<i class="fa fa-th-list"></i> ' + config.title;
        html += '<span class="SUB_TABLE_BADGE"><i class="fa fa-check-circle"></i> <span class="SUB_TABLE_COUNT">' + totalRows + '</span> حركة</span>';
        html += '</div>';
        html += '<div class="SUB_TABLE_CONTROLS">';
        html += '<button type="button" class="SUB_TABLE_CTRL_BTN SUB_TABLE_RELOAD_BTN" title="تحديث"><i class="fa fa-refresh"></i></button>';
        html += '<button type="button" class="SUB_TABLE_CTRL_BTN SUB_TABLE_CLOSE_BTN" title="إغلاق"><i class="fa fa-times"></i></button>';
        html += '</div></div>';

        // البحث السريع
        if (config.enableSearch) {
            html += '<div class="SUB_TABLE_SEARCH_BOX">';
            html += '<i class="fa fa-search"></i>';
            html += '<input type="text" class="SUB_TABLE_SEARCH_INPUT" placeholder="بحث سريع في التفاصيل...">';
            html += '</div>';
        }

        // جدول البيانات
        html += '<div class="SUB_TABLE_SCROLL">';
        html += '<table class="SUB_TABLE_GRID">';
        html += '<thead><tr>';
        data.columns.forEach(function (col) {
            html += '<th class="SUB_TABLE_TH">' + (col.label || col.name) + '</th>';
        });
        html += '</tr></thead><tbody>';

        data.rows.forEach(function (row) {
            html += '<tr class="SUB_TABLE_ROW">';
            row.forEach(function (val, idx) {
                var colType = data.columns[idx] ? data.columns[idx].type : "VARCHAR2";
                var isNum = colType === "NUMBER" ? ' SUB_TABLE_NUMERIC' : '';
                html += '<td class="SUB_TABLE_TD' + isNum + '">' + (val !== null ? val : "-") + '</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';

        $container.html(html);

        if (config.enableSearch) {
            $container.find(".SUB_TABLE_SEARCH_INPUT").on("click focus keydown", function (e) {
                e.stopPropagation();
            }).on("keyup", function (e) {
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