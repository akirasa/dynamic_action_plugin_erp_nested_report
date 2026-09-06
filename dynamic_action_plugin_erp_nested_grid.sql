--------------------------------------------------------------------------------
-- Copyright (c) 2024, 2026, المؤسسة العامة للطرق والجسور.
-- #G_CONNECTION_NAME# v2.1.0
--------------------------------------------------------------------------------
prompt --application/set_environment
set define off verify off feedback off
whenever sqlerror exit sql.sqlcode rollback
--------------------------------------------------------------------------------
--
-- Oracle APEX export file
--
-- You should run this script using a SQL client connected to the database as
-- the owner (parsing schema) of the application or as a database user with the
-- APEX_ADMINISTRATOR_ROLE role.
--
-- This export file has been automatically generated. Modifying this file is not
-- supported by Oracle and can lead to unexpected application and/or instance
-- behavior now or in the future.
--
-- NOTE: Calls to apex_application_install override the defaults below.
--
--------------------------------------------------------------------------------
begin
wwv_flow_imp.import_begin (
 p_version_yyyy_mm_dd=>'2024.11.30'
,p_release=>'24.2.0'
,p_default_workspace_id=>100000
,p_default_application_id=>111
,p_default_id_offset=>437238032658578151
,p_default_owner=>'GCRBADMIN'
);
end;
/
 
prompt APPLICATION 111 - ERP_GCRB88
--
-- Application Export:
--   Application:     111
--   Name:            ERP_GCRB88
--   Date and Time:   20:30 Sunday September 6, 2026
--   Exported By:     GCRB1
--   Flashback:       0
--   Export Type:     Component Export
--   Manifest
--     PLUGIN: 1772640266377102373
--   Manifest End
--   Version:         24.2.0
--   Instance ID:     716695067653462
--

begin
  -- replace components
  wwv_flow_imp.g_mode := 'REPLACE';
end;
/
prompt --application/shared_components/plugins/dynamic_action/erp_nested_grid
begin
wwv_flow_imp_shared.create_plugin(
 p_id=>wwv_flow_imp.id(1772640266377102373)
,p_plugin_type=>'DYNAMIC ACTION'
,p_name=>'ERP_NESTED_GRID'
,p_display_name=>'ERP Nested Grid'
,p_category=>'EXECUTE'
,p_javascript_file_urls=>'#APP_FILES#ERPNestedGridPlugin#MIN#.js'
,p_css_file_urls=>'#APP_FILES#ERPNestedGridPlugincss#MIN#.css'
,p_api_version=>1
,p_render_function=>'PKG_ERP_NESTED_GRID2.RENDER_DYNAMIC_ACTION'
,p_ajax_function=>'PKG_ERP_NESTED_GRID2.AJAX_CALLBACK'
,p_substitute_attributes=>true
,p_version_scn=>1361376379
,p_subscribe_plugin_settings=>false
,p_help_text=>unistr('\0625\0636\0627\0641\0629 \062C\062F\0648\0644 \0641\0631\0639\064A \0645\062A\062F\0627\062E\0644 \0644\062A\0642\0627\0631\064A\0631 APEX \0627\0644\062A\0641\0627\0639\0644\064A\0629 \0645\0639 \062F\0639\0645 \0627\0644\0628\062D\062B \0648\0627\0644\062A\0646\0633\064A\0642 \0627\0644\062A\0644\0642\0627\0626\064A.')
,p_version_identifier=>'3.0.0'
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102383)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>1
,p_display_sequence=>10
,p_prompt=>'SQL Query'
,p_attribute_type=>'TEXTAREA'
,p_is_required=>true
,p_is_translatable=>false
,p_help_text=>unistr('\0627\0633\062A\0639\0644\0627\0645 SQL \0644\062C\0644\0628 \0627\0644\062A\0641\0627\0635\064A\0644. \0627\0633\062A\062E\062F\0645 \062A\0633\0645\064A\0627\062A \0627\0644\0623\0639\0645\062F\0629 \0645\062B\0644: SELECT COL "\0627\0633\0645 \0627\0644\0639\0645\0648\062F"')
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102387)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>2
,p_display_sequence=>20
,p_prompt=>'Region Static ID'
,p_attribute_type=>'TEXT'
,p_is_required=>false
,p_is_translatable=>false
,p_help_text=>unistr('\0627\0644\0640 Static ID \0627\0644\062E\0627\0635 \0628\0627\0644\062A\0642\0631\064A\0631 \0627\0644\0631\0626\064A\0633\064A (\0627\062A\0631\0643\0647 \0641\0627\0631\063A\0627\064B \0644\0627\0643\062A\0634\0627\0641\0647 \062A\0644\0642\0627\0626\064A\0627\064B).')
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102388)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>3
,p_display_sequence=>30
,p_prompt=>'Primary Key / Link Column'
,p_attribute_type=>'TEXT'
,p_is_required=>true
,p_is_translatable=>false
,p_help_text=>unistr('\0627\0633\0645 \0639\0645\0648\062F \0627\0644\0631\0628\0637 \0641\064A \0627\0644\062A\0642\0631\064A\0631 \0627\0644\0631\0626\064A\0633\064A (\0645\062B\0644 ACC_ID).')
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102384)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>4
,p_display_sequence=>40
,p_prompt=>'Page Items to Submit'
,p_attribute_type=>'TEXT'
,p_is_required=>false
,p_is_translatable=>false
,p_help_text=>unistr('\0627\0643\062A\0628 \0623\0633\0645\0627\0621 \0639\0646\0627\0635\0631 \0627\0644\0635\0641\062D\0629 \0645\0641\0635\0648\0644\0629 \0628\0641\0627\0635\0644\0629 \0628\062F\0648\0646 JSON \0645\062B\0644: P1_FROM_DATE, P1_TO_DATE')
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102389)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>5
,p_display_sequence=>50
,p_prompt=>'Detail Table Title'
,p_attribute_type=>'TEXT'
,p_is_required=>false
,p_default_value=>unistr('\0627\0644\062D\0631\0643\0627\062A \0627\0644\062A\0641\0635\064A\0644\064A\0629')
,p_is_translatable=>true
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102390)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>6
,p_display_sequence=>60
,p_prompt=>'Table Style'
,p_attribute_type=>'SELECT LIST'
,p_is_required=>false
,p_default_value=>'STRIPED'
,p_is_translatable=>false
,p_lov_type=>'STATIC'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(1772640266377102453)
,p_plugin_attribute_id=>wwv_flow_imp.id(1772640266377102390)
,p_display_sequence=>10
,p_display_value=>unistr('\0635\0641\0648\0641 \0645\062E\0637\0637\0629 (Striped)')
,p_return_value=>'STRIPED'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(1772640266377102454)
,p_plugin_attribute_id=>wwv_flow_imp.id(1772640266377102390)
,p_display_sequence=>20
,p_display_value=>unistr('\0645\0636\063A\0648\0637 \0648\0639\0635\0631\064A (Compact)')
,p_return_value=>'COMPACT'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(1772640266377102455)
,p_plugin_attribute_id=>wwv_flow_imp.id(1772640266377102390)
,p_display_sequence=>30
,p_display_value=>unistr('\0628\0633\064A\0637 (Default)')
,p_return_value=>'DEFAULT'
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102392)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>7
,p_display_sequence=>70
,p_prompt=>'Enable Quick Search'
,p_attribute_type=>'CHECKBOX'
,p_is_required=>false
,p_default_value=>'Y'
,p_is_translatable=>false
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102391)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>8
,p_display_sequence=>80
,p_prompt=>'RTL Layout'
,p_attribute_type=>'CHECKBOX'
,p_is_required=>false
,p_default_value=>'Y'
,p_is_translatable=>false
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(1772640266377102395)
,p_plugin_id=>wwv_flow_imp.id(1772640266377102373)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>9
,p_display_sequence=>90
,p_prompt=>'Max Rows Fetched'
,p_attribute_type=>'NUMBER'
,p_is_required=>false
,p_default_value=>'100'
,p_is_translatable=>false
);
end;
/
prompt --application/end_environment
begin
wwv_flow_imp.import_end(p_auto_install_sup_obj => nvl(wwv_flow_application_install.get_auto_install_sup_obj, false)
);
commit;
end;
/
set verify on feedback on define on
prompt  ...done
