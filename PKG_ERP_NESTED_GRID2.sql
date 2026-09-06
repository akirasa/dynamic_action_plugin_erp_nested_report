create or replace PACKAGE PKG_ERP_NESTED_GRID2 AS
    FUNCTION RENDER_DYNAMIC_ACTION (
        p_dynamic_action IN apex_plugin.t_dynamic_action,
        p_plugin         IN apex_plugin.t_plugin
    ) RETURN apex_plugin.t_dynamic_action_render_result;

    FUNCTION AJAX_CALLBACK (
        p_dynamic_action IN apex_plugin.t_dynamic_action,
        p_plugin         IN apex_plugin.t_plugin
    ) RETURN apex_plugin.t_dynamic_action_ajax_result;
END PKG_ERP_NESTED_GRID2;
/

create or replace PACKAGE BODY PKG_ERP_NESTED_GRID2 AS

    PROCEDURE VALIDATE_SQL (p_sql IN VARCHAR2) IS
        l_sql VARCHAR2(32767) := TRIM(p_sql);
    BEGIN
        IF l_sql IS NULL THEN
            raise_application_error(-20801, 'SQL Query is required.');
        END IF;
        IF NOT REGEXP_LIKE(l_sql, '^[[:space:]]*(SELECT|WITH)[[:space:]]', 'i') THEN
            raise_application_error(-20802, 'Only SELECT/WITH queries are allowed.');
        END IF;
    END VALIDATE_SQL;

    FUNCTION RENDER_DYNAMIC_ACTION (
        p_dynamic_action IN apex_plugin.t_dynamic_action,
        p_plugin         IN apex_plugin.t_plugin
    ) RETURN apex_plugin.t_dynamic_action_render_result
    IS
        l_result apex_plugin.t_dynamic_action_render_result;
    BEGIN
        l_result.javascript_function := 'erpNestedGrid.execute';
        l_result.ajax_identifier     := apex_plugin.get_ajax_identifier;

        -- هذا الجزء هو الذي كان مفقوداً وتسبب في توقف البلجن:
        l_result.attribute_01 := p_dynamic_action.attribute_01;
        l_result.attribute_02 := p_dynamic_action.attribute_02;
        l_result.attribute_03 := p_dynamic_action.attribute_03;
        l_result.attribute_04 := p_dynamic_action.attribute_04;
        l_result.attribute_05 := p_dynamic_action.attribute_05;
        l_result.attribute_06 := p_dynamic_action.attribute_06;
        l_result.attribute_07 := p_dynamic_action.attribute_07;
        l_result.attribute_08 := p_dynamic_action.attribute_08;
        l_result.attribute_09 := p_dynamic_action.attribute_09;
        l_result.attribute_10 := p_dynamic_action.attribute_10;
        l_result.attribute_11 := p_dynamic_action.attribute_11;
        l_result.attribute_12 := p_dynamic_action.attribute_12;
        l_result.attribute_13 := p_dynamic_action.attribute_13;
        l_result.attribute_14 := p_dynamic_action.attribute_14;
        l_result.attribute_15 := p_dynamic_action.attribute_15;

        RETURN l_result;
    END RENDER_DYNAMIC_ACTION;

    FUNCTION AJAX_CALLBACK (
        p_dynamic_action IN apex_plugin.t_dynamic_action,
        p_plugin         IN apex_plugin.t_plugin
    ) RETURN apex_plugin.t_dynamic_action_ajax_result
    IS
        l_result        apex_plugin.t_dynamic_action_ajax_result;
        l_sql           VARCHAR2(32767);
        l_sql_page      VARCHAR2(32767);
        l_filters       JSON_OBJECT_T;

        l_cursor        INTEGER;
        l_exec          INTEGER;
        l_columns       DBMS_SQL.DESC_TAB2;
        l_column_count  PLS_INTEGER;

        l_number        NUMBER;
        l_date          DATE;
        l_varchar       VARCHAR2(32767);
        l_clob          CLOB;
        l_row_number    PLS_INTEGER := 0;

        PROCEDURE BIND_VARIABLES(p_cur IN INTEGER, p_query IN VARCHAR2) IS
            l_var_name VARCHAR2(100);
            l_var_val  VARCHAR2(32767);
            l_pos      PLS_INTEGER := 1;
        BEGIN
            LOOP
                l_var_name := REGEXP_SUBSTR(p_query, ':([A-Za-z0-9_$#]+)', 1, l_pos, 'i', 1);
                EXIT WHEN l_var_name IS NULL;
                l_var_name := UPPER(l_var_name);
                l_var_val  := NULL;

                IF l_filters IS NOT NULL AND l_filters.has(l_var_name) THEN
                    l_var_val := l_filters.get_string(l_var_name);
                ELSE
                    l_var_val := v(l_var_name);
                END IF;

                BEGIN
                    DBMS_SQL.BIND_VARIABLE(p_cur, ':' || l_var_name, l_var_val);
                EXCEPTION
                    WHEN OTHERS THEN NULL;
                END;
                l_pos := l_pos + 1;
            END LOOP;
        END BIND_VARIABLES;

    BEGIN
        l_sql := p_dynamic_action.attribute_01;
        VALIDATE_SQL(l_sql);

        IF apex_application.g_x02 IS NOT NULL THEN
            BEGIN
                l_filters := JSON_OBJECT_T.parse(apex_application.g_x02);
            EXCEPTION WHEN OTHERS THEN l_filters := NULL; END;
        END IF;

        -- جلب النتائج مع حماية سقف السجلات
        l_sql_page := 'SELECT * FROM (' || l_sql || ') WHERE ROWNUM <= 250';

        l_cursor := DBMS_SQL.OPEN_CURSOR;
        BEGIN
            DBMS_SQL.PARSE(l_cursor, l_sql_page, DBMS_SQL.NATIVE);
            BIND_VARIABLES(l_cursor, l_sql_page);
            DBMS_SQL.DESCRIBE_COLUMNS2(l_cursor, l_column_count, l_columns);

            FOR i IN 1 .. l_column_count LOOP
                IF l_columns(i).col_type = 2 THEN
                    DBMS_SQL.DEFINE_COLUMN(l_cursor, i, l_number);
                ELSIF l_columns(i).col_type = 12 THEN
                    DBMS_SQL.DEFINE_COLUMN(l_cursor, i, l_date);
                ELSIF l_columns(i).col_type = 112 THEN
                    DBMS_SQL.DEFINE_COLUMN(l_cursor, i, l_clob);
                ELSE
                    DBMS_SQL.DEFINE_COLUMN(l_cursor, i, l_varchar, 32767);
                END IF;
            END LOOP;

            l_exec := DBMS_SQL.EXECUTE(l_cursor);

            apex_json.open_object;
            apex_json.write('success', TRUE);

            apex_json.open_array('columns');
            FOR i IN 1 .. l_column_count LOOP
                apex_json.open_object;
                apex_json.write('name', l_columns(i).col_name);
                apex_json.write('label', l_columns(i).col_name);
                IF l_columns(i).col_type = 2 THEN
                    apex_json.write('type', 'NUMBER');
                ELSIF l_columns(i).col_type = 12 THEN
                    apex_json.write('type', 'DATE');
                ELSE
                    apex_json.write('type', 'VARCHAR2');
                END IF;
                apex_json.close_object;
            END LOOP;
            apex_json.close_array;

            apex_json.open_array('rows');
            WHILE DBMS_SQL.FETCH_ROWS(l_cursor) > 0 LOOP
                l_row_number := l_row_number + 1;
                apex_json.open_array;
                FOR i IN 1 .. l_column_count LOOP
                    IF l_columns(i).col_type = 2 THEN
                        DBMS_SQL.COLUMN_VALUE(l_cursor, i, l_number);
                        apex_json.write(l_number);
                    ELSIF l_columns(i).col_type = 12 THEN
                        DBMS_SQL.COLUMN_VALUE(l_cursor, i, l_date);
                        apex_json.write(TO_CHAR(l_date, 'YYYY-MM-DD'));
                    ELSIF l_columns(i).col_type = 112 THEN
                        DBMS_SQL.COLUMN_VALUE(l_cursor, i, l_clob);
                        apex_json.write(l_clob);
                    ELSE
                        DBMS_SQL.COLUMN_VALUE(l_cursor, i, l_varchar);
                        apex_json.write(l_varchar);
                    END IF;
                END LOOP;
                apex_json.close_array;
            END LOOP;
            apex_json.close_array;

            apex_json.write('returned', l_row_number);
            apex_json.close_object;

            DBMS_SQL.CLOSE_CURSOR(l_cursor);
        EXCEPTION
            WHEN OTHERS THEN
                IF DBMS_SQL.IS_OPEN(l_cursor) THEN DBMS_SQL.CLOSE_CURSOR(l_cursor); END IF;
                RAISE;
        END;

        RETURN l_result;
    END AJAX_CALLBACK;

END PKG_ERP_NESTED_GRID2;
/
