-- Seed default research templates
INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, structure, default_objectives, estimated_duration_days, difficulty_level, is_featured, is_public) VALUES
(
  'tpl_policy_analysis',
  'Policy Analysis Framework',
  'Comprehensive framework for analyzing public policies in Ghana''s civil service context',
  'policy',
  'mixed',
  '{"phases":["problem_definition","stakeholder_analysis","policy_options","impact_assessment","recommendations"],"milestones":["Literature Review","Stakeholder Mapping","Options Analysis","Draft Report","Final Submission"],"noteTypes":["methodology","findings","discussion"]}',
  '["Analyze current policy landscape","Identify key stakeholders","Evaluate policy alternatives","Provide evidence-based recommendations"]',
  90,
  'intermediate',
  1,
  1
);

INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, structure, default_objectives, estimated_duration_days, difficulty_level, is_featured, is_public) VALUES
(
  'tpl_case_study',
  'Case Study Research',
  'In-depth analysis of specific cases within Ghana''s public sector',
  'governance',
  'qualitative',
  '{"phases":["case_selection","data_collection","analysis","cross_case_comparison","conclusions"],"milestones":["Case Selection","Interview Protocol","Data Collection","Analysis","Report Writing"],"noteTypes":["methodology","findings","appendix"]}',
  '["Select representative cases","Develop data collection instruments","Conduct thorough analysis","Draw meaningful conclusions"]',
  120,
  'advanced',
  1,
  1
);

INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, structure, default_objectives, estimated_duration_days, difficulty_level, is_featured, is_public) VALUES
(
  'tpl_survey_research',
  'Survey Research Design',
  'Structured approach for conducting surveys across government departments',
  'service_delivery',
  'quantitative',
  '{"phases":["design","sampling","data_collection","analysis","reporting"],"milestones":["Survey Design","Pilot Testing","Data Collection","Statistical Analysis","Report"],"noteTypes":["methodology","findings","conclusion"]}',
  '["Design valid survey instrument","Ensure representative sampling","Collect quality data","Apply appropriate statistical methods"]',
  60,
  'intermediate',
  1,
  1
);

INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, structure, default_objectives, estimated_duration_days, difficulty_level, is_featured, is_public) VALUES
(
  'tpl_literature_review',
  'Systematic Literature Review',
  'Methodical review of existing research and documentation',
  'reform',
  'qualitative',
  '{"phases":["protocol_development","search","screening","extraction","synthesis"],"milestones":["Search Strategy","Initial Screening","Full-text Review","Data Extraction","Synthesis"],"noteTypes":["methodology","findings","discussion"]}',
  '["Define clear research questions","Develop comprehensive search strategy","Apply rigorous screening criteria","Synthesize findings systematically"]',
  45,
  'beginner',
  1,
  1
);

INSERT OR IGNORE INTO research_templates (id, name, description, category, methodology, structure, default_objectives, estimated_duration_days, difficulty_level, is_featured, is_public) VALUES
(
  'tpl_evaluation',
  'Program Evaluation',
  'Evaluate effectiveness of government programs and initiatives',
  'service_delivery',
  'mixed',
  '{"phases":["evaluation_design","baseline","implementation","outcome_assessment","recommendations"],"milestones":["Evaluation Framework","Baseline Data","Mid-term Review","Final Evaluation","Report"],"noteTypes":["methodology","findings","recommendations"]}',
  '["Establish evaluation criteria","Collect baseline data","Monitor implementation","Assess outcomes and impact"]',
  180,
  'advanced',
  0,
  1
);
