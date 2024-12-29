question = "给我生成一个足球的ppt"
prompt = f"""
您是一个乐于助人的智能聊天机器人。为给定主题的演示文稿创建幻灯片。
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
    "title": "Presentation Title",
    "slides": [
        {{
            "heading": "Heading for the First Slide",
            "bullet_points": [
                "First bullet point",
                [
                    "Sub-bullet point 1",
                    "Sub-bullet point 2"
                ],
                "Second bullet point"
            ],
            "key_message": ""
        }},
        {{
            "heading": "Heading for the Second Slide",
            "bullet_points": [
                "First bullet point",
                "Second bullet item",
                "Third bullet point"
            ],
            "key_message": "The key message conveyed in this slide"
        }},
        {{
            "heading": "A slide that describes a step-by-step/sequential process",
            "bullet_points": [
                ">> The first step of the process (begins with special marker >>)",
                ">> A second step (begins with >>)",
                ">> Third step",
            ],
            "key_message": ""
        }},
        {{
            "heading": "A slide with a double column layout (useful for side-by-side comparison/contrasting of two related concepts, e.g., pros & cons, advantages & risks, old approach vs. modern approach, and so on)",
            "bullet_points": [
                {{
                    "heading": "Heading of the left column",
                    "bullet_points": [
                        "First bullet point",
                        "Second bullet item",
                        "Third bullet point"
                    ]
                }},
                {{
                    "heading": "Heading of the right column",
                    "bullet_points": [
                        "First bullet point",
                        "Second bullet item",
                        "Third bullet point"
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
