import requests
import json


class OllamaClient:
    def __init__(self, model="llama2", api_url="http://localhost:11434/v1/chat/completions"):
        self.model = model
        self.api_url = api_url

    def submit_prompt(self, prompt, **kwargs):
        """
        与 Ollama 进行对话推理
        :param prompt: 输入的提示内容
        :param kwargs: 其他额外的参数
        :return: 推理结果
        """
        headers = {
            "Content-Type": "application/json",
        }

        data = {
            "model": self.model,
            "messages": [{"role": "system", "content": "You are a helpful assistant."},
                         {"role": "user", "content": prompt}],
            "stream": False,
        }

        # 合并额外的参数（例如 keep_alive 或其他配置）
        data.update(kwargs)

        # 发送请求到 Ollama API
        response = requests.post(self.api_url, headers=headers, data=json.dumps(data))

        # 检查响应状态
        if response.status_code == 200:
            response_data = response.json()
            return response_data['choices'][0]['message']['content']
        else:
            return f"Error: {response.status_code}, {response.text}"


import ollama

question = "给我生成一个足球的ppt"
prompt = f"""
你是一个财务分析专家，基于以下对话历史记录，生成一个详细的财务分析的PPT，格式为Json，PPT包含以下部分：
1. **前言**：总结查询的背景和目的。
2. **查询内容**：详细列出用户请求的查询项。
3. **数据展示**：展示查询到的数据，包含时间范围内的变化情况。
4. **深入分析**：对查询的数据进行详细分析.
5. **结论与建议**：总结数据的发现，并给出可操作的建议。
为给定主题的演示文稿创建幻灯片。
包括每张幻灯片的主标题和每张幻灯片的详细要点。
向每张幻灯片添加相关内容。
每张幻灯片的内容应该是详细的、描述性的和非常详细的。
如果相关，请添加一两个 EXAMPLES 来说明概念。
对于两张或三张重要的幻灯片，生成这些幻灯片传达的关键信息。
确定幻灯片是否描述了分步/顺序过程，然后以特殊标记>>开始要点。将其限制为最多 2 或 3 张幻灯片。
此外，通过根据下面提供的 JSON 架构中的描述生成适当的内容，至少添加一张具有双列布局的幻灯片。
始终在末尾添加一张结束幻灯片，其中包含关键要点列表和可选的号召性用语（如果与上下文相关）。
除非有明确说明，否则请总共创建 5 到 7 张幻灯片。



### Topic:
{question}


The output must be only a valid and syntactically correct JSON adhering to the following schema:
{{
    "title": "演示文稿标题",
    "slides": [
        {{
            "heading": "第一张幻灯片的标题",
            "bullet_points": [
                "第一项要点",
                [
                    "子要点 1",
                    "子要点 2"
                ],
                "第二项要点"
            ],
            "key_message": ""
        }},
        {{
            "heading": "第二张幻灯片的标题",
            "bullet_points": [
                "第一项要点",
                "第二项要点",
                "第三项要点"
            ],
            "key_message": "这张幻灯片传达的关键信息"
        }},
        {{
            "heading": "描述逐步过程的幻灯片",
            "bullet_points": [
                ">> 过程的第一步（以特殊标记 >> 开头）",
                ">> 第二步（以 >> 开头）",
                ">> 第三步",
            ],
            "key_message": ""
        }},
        {{
            "heading": "双栏布局的幻灯片（用于并排对比或对照两个相关的概念，例如优缺点、优势与风险、旧方法与现代方法等）",
            "bullet_points": [
                {{
                    "heading": "左栏标题",
                    "bullet_points": [
                        "第一项要点",
                        "第二项要点",
                        "第三项要点"
                    ]
                }},
                {{
                    "heading": "右栏标题",
                    "bullet_points": [
                        "第一项要点",
                        "第二项要点",
                        "第三项要点"
                    ]
                }}
            ],
            "key_message": ""
        }}
    ]
}}

### Output:
```json
"""


def generate_slide_deck(json_str: str):
    """
    Create a slide deck.

    :param json_str: The content in *valid* JSON format.
    """

    path = "financial_report.pptx"
    pptx_template = r"./pptx_templates/Blank.pptx"

    try:
        pptx_helper.generate_powerpoint_presentation(
            json_str,
            slides_template=pptx_template,
            output_file_path=path
        )  # 生成幻灯片文件
    except ValueError:

        pptx_helper.generate_powerpoint_presentation(
            text_helper.fix_malformed_json(json_str),
            slides_template=pptx_template,
            output_file_path=path
        )  # 生成幻灯片文件


# 示例用法
import ollama
from helpers import pptx_helper, text_helper  # 导入帮助函数

if __name__ == "__main__":
    # ollama_client = OllamaClient(model="qwq:32b")  # 你可以根据需要更改模型名称
    # text = [{'role': 'system',
    #          'content': '你是一个熟练的财务分析师。根据以下对话历史记录，创建一个详细的 PPT，格式为 json，PPT包含以下部分：\n\n1. **前言**：总结查询的背景和目的。\n2. **查询内容**：详细列出用户的具体查询项。\n3. **数据展示**：展示查询到的数据，包括时间变化趋势。\n4. **深入分析**：对数据进行深入分析，例如资产、负债和所有者权益的变化。\n5. **结论与建议**：总结发现并提出可操作的建议。'},
    #         {'role': 'user', 'content': '告诉我2023年A公司合并每个月的利润总额是多少'}, {'role': 'assistant',
    #                                                                   'content': '查到的数据表: [{"年份":2023,"月份":1,"单位":"万元","利润总额":1648.164544},{"年份":2023,"月份":2,"单位":"万元","利润总额":12618.871616},{"年份":2023,"月份":3,"单位":"万元","利润总额":22615.202272},{"年份":2023,"月份":4,"单位":"万元","利润总额":18995.560896},{"年份":2023,"月份":5,"单位":"万元","利润总额":24913.3976},{"年份":2023,"月份":6,"单位":"万元","利润总额":19866.124512},{"年份":2023,"月份":7,"单位":"万元","利润总额":28204.205952}]\n数据表的总结: 根据用户的问题，我从数据库中获取了A公司在2023年每个月的合并利润总额数据，并以DataFrame的形式呈现。DataFrame包含了六列：索引、年份、月份、单位和利润总额。数据显示了从1月到7月的利润总额，单位是万元。具体数值如下：\n\n- 1月：1,648.16万元\n\n- 2月：12,618.9万元\n\n- 3月：22,615.2万元\n\n- 4月：18,995.6万元\n\n- 5月：24,913.4万元\n\n- 6月：19,866.1万元\n\n- 7月：28,204.2万元\n\n这些数据可以帮助用户了解A公司在2023年前七个月的财务表现。'},
    #         {'role': 'user',
    #          'content': '\n### 生成PPT要求\n你是一个财务分析专家，基于以下对话历史记录，生成一个详细的财务分析的PPT，格式为Json，PPT包含以下部分：\n1. **前言**：总结查询的背景和目的。\n2. **查询内容**：详细列出用户请求的查询项。\n3. **数据展示**：展示查询到的数据，包含时间范围内的变化情况。\n4. **深入分析**：对查询的数据进行详细分析.\n5. **结论与建议**：总结数据的发现，并给出可操作的建议。\n每张幻灯片的主标题和每张幻灯片的详细要点。\n向每张幻灯片添加相关内容。\n每张幻灯片的内容应该是详细的、描述性的和非常详细的。\n如果相关，请添加一两个 EXAMPLES 来说明概念。\n对于两张或三张重要的幻灯片，生成这些幻灯片传达的关键信息。\n确定幻灯片是否描述了分步/顺序过程，然后以特殊标记>>开始要点。将其限制为最多 2 或 3 张幻灯片。\n此外，通过根据下面提供的 JSON 架构中的描述生成适当的内容，至少添加一张具有双列布局的幻灯片。\n始终在末尾添加一张结束幻灯片，其中包含关键要点列表和可选的号召性用语（如果与上下文相关）。\n除非有明确说明，否则请总共创建 5 到 7 张幻灯片。\n\n\nThe output must be only a valid and syntactically correct JSON adhering to the following schema:\n{\n    "title": "演示文稿标题",\n    "slides": [\n        {\n            "heading": "第一张幻灯片的标题",\n            "bullet_points": [\n                "第一项要点",\n                [\n                    "子要点 1",\n                    "子要点 2"\n                ],\n                "第二项要点"\n            ],\n            "key_message": ""\n        },\n        {\n            "heading": "第二张幻灯片的标题",\n            "bullet_points": [\n                "第一项要点",\n                "第二项要点",\n                "第三项要点"\n            ],\n            "key_message": "这张幻灯片传达的关键信息"\n        },\n        {\n            "heading": "描述逐步过程的幻灯片",\n            "bullet_points": [\n                ">> 过程的第一步（以特殊标记 >> 开头）",\n                ">> 第二步（以 >> 开头）",\n                ">> 第三步",\n            ],\n            "key_message": ""\n        },\n        {\n            "heading": "双栏布局的幻灯片（用于并排对比或对照两个相关的概念，例如优缺点、优势与风险、旧方法与现代方法等）",\n            "bullet_points": [\n                {\n                    "heading": "左栏标题",\n                    "bullet_points": [\n                        "第一项要点",\n                        "第二项要点",\n                        "第三项要点"\n                    ]\n                },\n                {\n                    "heading": "右栏标题",\n                    "bullet_points": [\n                        "第一项要点",\n                        "第二项要点",\n                        "第三项要点"\n                    ]\n                }\n            ],\n            "key_message": ""\n        }\n    ]\n}\n\n### Output:\n```json\n\n请确保：\n- 不要有额外的解释或多余的内容。\n- 按照要求生成每一部分内容，不要漏掉任何部分。\n- 输出必须符合 Json 格式，方便生成PPT。\n    '}]
    #
    # response = ollama_client.submit_prompt(prompt)
    #
    # response_cleaned = text_helper.get_clean_json(response)
    # generate_slide_deck(response_cleaned)# 生成幻灯片文件
    # print(response_cleaned)
    # prompt = [{'role': 'system',
    #            'content': "你是一个数据库和知识系统的助手，你可以根据数据库中的表来回答数据相关问题，也可以通过你的知识回答一般性问题。\n请在回答问题前，判断该问题是否需要查询数据库。如果需要查询数据库，请生成SQL；\n如果不需要，请直接回答\n日期字段的属性是timestamp,\n生成where的时候，主要不要搞错了字段的内容\nSQL查询中将英文列名用AS转换为中文方便理解,中文记得加上引号\n一步一步的分析问题，生成sql来解决问题给出答案\n生成 SQL 查询时，无论是做差值、汇总还是对比，请始终避免跨行计算。确保相关字段出现在同一行内进行运算，避免产生不准确的结果。\n\n===Additional Context \n\n\n    -- public.twb_ygl0078 definition\n    \n    -- Drop table\n    \n    -- DROP TABLE public.twb_ygl0078;\n    \n    CREATE TABLE public.twb_ygl0078 (\n        organ_code varchar(255) NULL, -- 组织代码\n        organ_name varchar(255) NULL, -- 组织名称\n        tdate timestamp NULL, -- 交易日期\n        ind_cate_name varchar(255) NULL, -- 指标类别名称\n        mat_ind_name varchar(255) NULL, -- 指标名称\n        unit_name varchar(255) NULL, -- 单位\n        curr_y_budget float8 NULL, -- 年度预算\n        last_m_pe_num float8 NULL, -- 上月\n        curr_m_pe_num float8 NULL, -- 本月\n        last_ym_pe_num float8 NULL, -- 上年同期\n        curr_y_pe_num float8 NULL, -- 本年累计\n        uploadtime timestamp NULL -- 上传日期\n    );\n    \n    -- Column comments\n    \n    COMMENT ON COLUMN public.twb_ygl0078.organ_code IS '组织代码';\n    COMMENT ON COLUMN public.twb_ygl0078.organ_name IS '组织名称';\n    COMMENT ON COLUMN public.twb_ygl0078.tdate IS '交易日期';\n    COMMENT ON COLUMN public.twb_ygl0078.ind_cate_name IS '指标类别名称';\n    COMMENT ON COLUMN public.twb_ygl0078.mat_ind_name IS '指标名称';\n    COMMENT ON COLUMN public.twb_ygl0078.unit_name IS '单位';\n    COMMENT ON COLUMN public.twb_ygl0078.curr_y_budget IS '年度预算';\n    COMMENT ON COLUMN public.twb_ygl0078.last_m_pe_num IS '上月';\n    COMMENT ON COLUMN public.twb_ygl0078.curr_m_pe_num IS '本月';\n    COMMENT ON COLUMN public.twb_ygl0078.last_ym_pe_num IS '上年同期';\n    COMMENT ON COLUMN public.twb_ygl0078.curr_y_pe_num IS '本年累计';\n    COMMENT ON COLUMN public.twb_ygl0078.uploadtime IS '上传日期';\n    \ntwb_ygl0078是一张集团汇总指标的数据表。该表专注于汇总各个组织的关键财务和经营指标，提供年度预算及各类时间维度下的数据表现，如本月、上月、上年同期和本年累计的数据。各列详细说明如下：\n\n1.organ_code (varchar): 组织代码，用于唯一标识集团下的各个子公司或组织。\n2.organ_name (varchar): 组织名称，记录子公司或组织的名称。\n3.tdate (timestamp): 交易日期，记录数据所属的具体日期。\n4.ind_cate_name (varchar): 指标类别名称，标识数据所属的类别（如财务、销售等类别）。\n5.mat_ind_name (varchar): 指标名称，描述具体的指标（如年度预算、本月支出等）。\n6.unit_name (varchar): 单位，记录指标的计量单位（如万元、件等）。\n7.curr_y_budget (float8): 年度预算，记录该组织或子公司在当前年度的预算数额。\n8.last_m_pe_num (float8): 上月，记录该组织在上月的指标数据。\n9.curr_m_pe_num (float8): 本月，记录该组织在本月的指标数据。\n10.last_ym_pe_num (float8): 上年同期，记录该组织在上年同期的指标数据。\n11.curr_y_pe_num (float8): 本年累计，记录从1月到本月的累计值。\n12.uploadtime (timestamp): 上传日期，表示该数据的最后更新时间。\n\n\n    twb_ygl0078表\n    **关键字段**:\n1. **organ_name** (组织名):\n   - **固定取值列表**: \n     - [F公司, B公司（管理）, D公司一期评估差额, B公司（母公司）, N公司, A公司（合并）, D公司（合并）, H公司, D公司, G公司（合并）, L公司, L公司（惠州差额）, J公司, E公司（合并组）, E公司, B公司（广东合并）, B公司（本部）, M公司, G公司, E公司（能源差额）, O公司, B公司（抵消）, I公司, G公司（肇庆差额）, A公司（分公司差额）, A公司（本部）, B公司（管理差额）, L公司（合并组）, C公司, K公司]\n   - **说明**: 该字段的值只能是上述列表中的某一个，且不能有其他取值。\n**注意**:\n- **organ_name** 必须严格按照上述固定取值中的一个进行匹配。\n- 任何不在上述固定列表中的值都是无效的，不应出现在查询的 `WHERE` 子句中。\n以下是mat_ind_name和ind_cate_name字段的内容：\n\n| mat_ind_name   | ind_cate_name   |\n|:---------------|:----------------|\n| 资产负债率          | 偿债风险指标          |\n| 速动比率           | 偿债风险指标          |\n| 净资产收益率         | 盈利能力指标          |\n| 化工品量           | 主要业务指标          |\n| 新能源收入          | 国资委考核指标         |\n| 去产能（煤炭）        | 国资委考核指标         |\n| 百元营业收入负担营业总成本  | 其他指标            |\n| 总资产周转率         | 资产质量指标          |\n| 营业收入增长率        | 成长性指标           |\n| 营业总成本          | 其他指标            |\n| 港口作业量          | 主要业务指标          |\n| 煤炭销售量          | 主要业务指标          |\n| 经济增加值          | 国资委考核指标         |\n| 带息负债           | 国资委考核指标         |\n| 利润总额           | 国资委考核指标         |\n| 销售费用           | 其他指标            |\n| 净利润            | 国资委考核指标         |\n| 存货周转率          | 资产质量指标          |\n| 科技支出           | 国资委考核指标         |\n| 自产煤量           | 主要业务指标          |\n| 两金             | 国资委考核指标         |\n| 营业利润率          | 盈利能力指标          |\n| 全民劳动生产率        | 国资委考核指标         |\n| 航运量            | 主要业务指标          |\n| 平均职工人数         | 国资委考核指标         |\n| 带息负债率          | 偿债风险指标          |\n| 已获利息倍数         | 偿债风险指标          |\n| 自产煤年度长协数量      | 主要业务指标          |\n| 自产煤年度长协金额      | 主要业务指标          |\n| 毛利率            | 其他指标            |\n| 售电均价（不含税）      | 主要业务指标          |\n| 自产煤年度长协价（含税）   | 主要业务指标          |\n| 成本费用占收入比       | 盈利能力指标          |\n| 资产负债率          | 国资委考核指标         |\n| 铁路运输量          | 主要业务指标          |\n| 总资产报酬率         | 盈利能力指标          |\n| 资本累积率          | 成长性指标           |\n| 应收账款周转率        | 资产质量指标          |\n| 劳动生产总值         | 国资委考核指标         |\n| 发电量            | 主要业务指标          |\n| 营业总收入          | 其他指标            |\n| 流动资产周转率        | 资产质量指标          |\n| 利润总额增长率        | 成长性指标           |\n\n请根据这些数据生成 SQL 查询，并确保 WHERE 子句中的值和列搭配一致。\n\n===Response Guidelines \n1. You are a database and knowledge assistant. You can answer data-related questions using the tables in the database, or answer general questions using your knowledge. Before answering, assess whether the question needs a database query. \n2. For conditions,  treat date fields as timestamps.\n3. If the provided context is sufficient, please generate a valid SQL query. \n4. If the provided context is almost sufficient but requires knowledge of a specific string in a particular column, please generate an intermediate SQL query to find the distinct strings in that column. Prepend the query with a comment saying intermediate_sql \n5. Please use the most relevant table(s). \n6. If the question has been asked and answered before, please repeat the answer exactly as it was given before. \n7. Ensure that the output SQL is PostgreSQL-compliant and executable, and free of syntax errors. \n生成where的时候，主要不要搞错了字段的内容。\nSQL查询中将英文列名用AS转换为中文方便理解,中文记得加上引号\n一步一步的分析问题，生成sql来解决问题给出答案\n如果这个问题之前已经被问过并且回答过，请准确地重复之前给出的答案。\n生成 SQL 查询时，无论是做差值、汇总还是对比，请始终避免跨行计算。确保相关字段出现在同一行内进行运算，避免产生不准确的结果。\n"},
    #           {'role': 'user',
    #            'content': '\n        \n---\n\n### 规则说明\n1. **判断是否需要查询数据库**：\n   - 如果问题涉及数据查询或计算，请先一步步分析问题，再生成 SQL。\n   - 如果问题无需查询数据库，请直接回答用户问题。\n2. **SQL 生成规则**：\n   - 表名、字段和条件必须严格按照 system 提供的固定取值范围。\n   - 使用 `WITH` 结构组织查询，以提高可读性和扩展性。\n   - 确保查询在 SQL 中给出具体的结果。\n   - **无论查询还是计算，若表中有单位字段，必须在最终结果中包含单位字段**。\n3. **单位字段的特殊规则**：\n   - 如果其他字段使用了聚合函数（如 `SUM`、`AVG` 等），单位字段应加入 `GROUP BY` 子句。\n   - 如果计算结果与单位字段无直接关联（如跨列计算），结果表中仍需保留单位字段，作为辅助信息。\n4. **特殊注意**：\n   - 避免跨行计算，所有计算仅在单行内完成。\n   - 日期字段类型为 `timestamp`，查询中应考虑日期格式兼容。\n   - **比率计算时不再乘以 100，直接输出比率值**。\n   - 如果查询中的字段发生别名变化（例如 AS 用法），应确保后续 SELECT 使用正确的别名字段，而不是原字段名\n---\n\n### 用户提问\n告诉我A公司合并的2023年每个月的利润总额是多少\n\n---\n\n### 输出要求\n根据用户提问和规则说明：\n1. 判断问题是否需要查询数据库。\n   - 如果需要，请一步步分析问题后生成 SQL。\n   - 如果不需要，请直接回答问题。\n2. **生成 SQL 的结构**：\n   - 使用 `WITH` 子句进行逻辑拆分。\n   - 确保查询结果输出具体的计算或筛选值。\n   - **无论查询还是计算，结果中必须包含单位字段，且不得引发 SQL 语法错误**。\n   - **确保 SQL 查询中的公司和日期字段始终按需要进行分组，并避免跨行计算或计算错误**。\n   - 如果有聚合函数，单位字段必须加入 `GROUP BY` 子句。\n   - 日期字段类型为 `timestamp`，查询中应考虑日期格式兼容。\n3. **SQL 示例格式**：\n   ```sql\n   -- 请将生成的 SQL 放置在此格式中，确保语法正确\n   ```\n'}]
    #
    # prompt=[{"role":"user","content":"你好"},{"role":"assistant","content":"你好！有什么我可以帮助你的吗？"},{"role":"user","content":"给我生成一个markdown"}]
    prompt = [{"role": "system", "content": "initial_prompt"}, {"role": "user", "content": "模板输入"}]  # assistant
    res = ollama.chat(model="qwq:32b", stream=False, messages=prompt)
    print(res["message"]["content"])

    # 提示词工程：json>markdown>纯文本格式
