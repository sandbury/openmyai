<script>
    let trainingData = [];
    let currentView = 'default'; // 默认视图
    let errorMessage = ''; // 用于存储错误信息
    import {onMount} from 'svelte';
    import {afterUpdate} from "svelte";

    let isMounted = false; // 用于标记组件是否已经挂载
    let load_questions = []; // 存储获取的问题
    let header = ''; // 存储标题
    let talk = false;//是否进入谈话界面
    let response_timeout = false
    // 当组件挂载时，获取问题数据
    onMount(async () => {
        if (!isMounted) {
            isMounted = true;
            const response = await fetch('/api/v0/generate_questions');
            const data = await response.json();

            // 处理获取的数据
            if (data.type === 'question_list') {
                load_questions = data.questions; // 获取问题列表
                header = data.header; // 获取标题
            }
        }
    });

    let mode = 'database'; // 默认状态为数据库模式

    // 切换模式函数
    function toggleMode() {
        mode = (mode === 'database') ? 'file' : 'database';
        console.log(`切换到: ${mode === 'database' ? '数据库' : '文件'}`);
    }


    async function switchView(view) {
        currentView = view;

        if (view === 'trainingData') {
            const response = await fetch('/api/v0/get_training_data');
            const data = await response.json();

            if (data.type === 'df') {
                trainingData = JSON.parse(data.df); // 解析数据并赋值给 trainingData
            }
        }
    }

    async function deleteItem(id) {
        const response = await fetch('/api/v0/remove_training_data', {
            method: 'POST', // 使用 POST 方法
            headers: {
                'Content-Type': 'application/json', // 设置请求头为 JSON
            },
            body: JSON.stringify({id}), // 将 id 封装为 JSON 对象
        });

        const result = await response.json();
        if (result.success) {
            switchView("trainingData")
            // 处理成功情况，比如从界面中移除该项
        } else {
            console.error(result.error);
            // 处理错误情况
        }
    }

    import {tick} from 'svelte';

    let questionInput = ''; // 用于存储输入框的内容
    let questionInput_tmp = '';//用于复制输入框的内容
    let response_json = "";//llm响应的json
    let response = "";//llm响应
    let response_chart = ""//图表的响应
    let response_tmp = ""//用于装载修改sql时候的响应
    let pd_response = "";
    let pd_data = "";
    let chart_data = ""
    let tableHeaders = "";
    let cycle = 0;
    let container = ""//显示图表的容器
    let conversationHistory = []; // 存储对话记录
    function renderChart(id, chartData) {
        container = document.getElementById(`chart-container-${id}`);
        console.log("开始渲染图表")
        if (container && chartData) {
            try {
                Plotly.newPlot(container, chartData.data, chartData.layout || {}).then(() => {
                    // 动态移除 logo 按钮
                    const logoButton = container.querySelector('.modebar-btn--logo');
                    if (logoButton) {
                        logoButton.remove();
                    }
                });
            } catch (error) {
                console.error("图表渲染失败:", error);
                // 你可以在这里做一个错误提示或者设置默认的图表状态
                // container.innerHTML = "图表渲染失败"; // 例如显示错误信息
            }
        }


    }

    $: {
        const lastEntry = conversationHistory[conversationHistory.length - 1];
        if (lastEntry && lastEntry.show_chart) {
            // 异步操作，确保 DOM 更新完成
            (async () => {
                await tick();
                const container = document.getElementById(`chart-container-${lastEntry.id}`);
                if (container) {
                    renderChart(lastEntry.id, lastEntry.chartData);
                }
            })();
        }
    }
    const synth = window.speechSynthesis;
    let isPlaying = false; // 控制语音播放状态
    function playText(text) {//语言播放

        // Microsoft Huihui、Microsoft Kangkang 或 Microsoft Yaoyao

        // 如果正在播放语音，则返回
        if (isPlaying || synth.speaking) {
            console.log("当前语音正在播放中，无法开始新的播放");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.pitch = 1.5;
        utterance.rate = 1.2;

        // 获取语音列表并选择指定语音
        const voices = synth.getVoices();
        const selectedVoice = voices.find(voice => voice.lang === "zh-CN" && voice.name.includes("Microsoft Yaoyao"));

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // 播放语音前设置播放状态
        isPlaying = true;

        // 当语音播放结束时，重置播放状态
        utterance.onend = () => {
            console.log("语音播放完毕，准备下次播放");
            isPlaying = false; // 播放结束后允许新语音播放
        };

        // 开始播放语音
        synth.speak(utterance);
    }


    // 创建语音识别对象（支持的浏览器需要提供 Web Speech API）
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    // 设置语言为中文
    recognition.lang = 'zh-CN'; // 设置为中文
    recognition.interimResults = true; // 实时返回识别结果
    recognition.maxAlternatives = 1; // 只返回最有可能的识别结果

    // 识别到语音时的回调
    recognition.onresult = (event) => {
        // 获取识别到的文本
        questionInput = event.results[0][0].transcript;
    };

    // 错误回调
    recognition.onerror = (event) => {
        console.error("语音识别错误:", event.error);
    };

    // 开始语音识别
    function startSpeechRecognition() {
        recognition.start();
    }


    const handleGenerateSQL = async () => {
        // 发送请求到后端
        try {
            questionInput_tmp = questionInput
            questionInput = '';
            talk = true;
            response_timeout = false
            conversationHistory.push({
                id: 12,
                question: questionInput_tmp,
                response: "",
                show_response: false,
                show_pd: false,
                pd_data: "",
                tableHeaders: "",
                show_chart: false,
                chartData: "",
                summary: "",
                selected: false
            });
            conversationHistory = [...conversationHistory]//这里更新界面，展示思考中的动画

            response_json = await fetch(`/api/v0/generate_sql?question=${encodeURIComponent(questionInput_tmp)}&&former_doc_list=false&&mode_web=${encodeURIComponent(mode)}`);
            if (response_json.ok) {
                response = await response_json.json();
                if (response.type === 'sql') {

                    if (response.sql_que !== "") {

                        pd_response = await fetch(`/api/v0/run_sql?id=${encodeURIComponent(response.id)}`)
                        pd_data = await pd_response.json()
                        console.log(pd_data.ok)

                        console.log(cycle)

                        while (pd_response.ok && pd_data.type === "error" && cycle < 4) {//第一次sql执行错误，把错误继续提问，重新生成sql，直到能查询到数据为止
                            cycle += 1
                            if (cycle === 4) {
                                response_timeout = true;
                                break;
                            }
                            console.log(cycle);
                            response_json = await fetch(`/api/v0/generate_sql?question=${encodeURIComponent(pd_data.error)}&&former_doc_list=true&&mode_web=${encodeURIComponent(mode)}`);
                            if (response_json.ok) {
                                console.log("进入1");
                                response = await response_json.json();
                                if (response.type === 'sql') {
                                    // conversationHistory[conversationHistory.length - 1].show_response = true;
                                    // conversationHistory[conversationHistory.length - 1].response = response.text;
                                    // conversationHistory[conversationHistory.length - 1].id = response.id;
                                    console.log("进入2");
                                    if (response.sql_que !== "") {
                                        pd_response = await fetch(`/api/v0/run_sql?id=${encodeURIComponent(response.id)}`)
                                        pd_data = await pd_response.json()
                                        console.log("进入3");

                                    } else {

                                        pd_data.error += "重新生成一次，找不到sql";
                                    }
                                }

                            }
                        }
                        cycle = 0


                        if (pd_data.type !== "error") {


                            pd_data = JSON.parse(pd_data.df);  // 将返回的数据赋值给 tableData
                            // console.log(pd_data[1]);  // 检查 pd_data 的内容和类型

                            // 动态生成表头
                            if (pd_data.length > 0) {
                                tableHeaders = Object.keys(pd_data[0]);  // 获取字段名
                                // console.log(tableHeaders);
                            }

                            conversationHistory[conversationHistory.length - 1].show_pd = true;
                            conversationHistory[conversationHistory.length - 1].pd_data = pd_data;
                            conversationHistory[conversationHistory.length - 1].tableHeaders = tableHeaders;

                            response_chart = await fetch(`/api/v0/generate_plotly_figure?id=${encodeURIComponent(response.id)}&&question=${encodeURIComponent(questionInput_tmp)}`);
                            chart_data = await response_chart.json();
                            if (chart_data.type === "plotly_figure") {
                                const figJson = JSON.parse(chart_data.fig);
                                console.log("获得图表代码")
                                console.log(figJson)
                                conversationHistory[conversationHistory.length - 1].show_chart = true;
                                conversationHistory[conversationHistory.length - 1].chartData = figJson;
                                conversationHistory[conversationHistory.length - 1].summary = chart_data.summary
                                console.log("总结：" + conversationHistory[conversationHistory.length - 1].summary)
                            }

                        }

                    }
                    if (response_timeout !== true) {
                        conversationHistory[conversationHistory.length - 1].show_response = true;
                        conversationHistory[conversationHistory.length - 1].response = response.text;
                        conversationHistory[conversationHistory.length - 1].id = response.id;
                    }

                }
                conversationHistory = [...conversationHistory]


            }
        } catch (error) {
            console.error('Fetch错误:', error);
            errorMessage = '请求失败，请稍后重试。'; // 设置错误信息
        }


    };
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            // 调用生成 SQL 的处理函数
            handleGenerateSQL();
        }
    };
    let showConfirm = false;
    let showCheckbox = false; // 控制勾选框显示
    let showConfirm_ppt = false;

    // 显示确认框
    function showReportConfirm() {
        showCheckbox = true; // 显示勾选框
        showConfirm = true;  // 显示确认框
    }

    // 取消生成报告
    function cancelReport() {
        showConfirm = false;
        showCheckbox = false; // 隐藏勾选框
    }

    function showReportConfirm_ppt() {
        showCheckbox = true; // 显示勾选框
        showConfirm_ppt = true;  // 显示确认框
    }

    // 取消生成报告
    function cancelReport_ppt() {
        showConfirm_ppt = false;
        showCheckbox = false; // 隐藏勾选框
    }

    // 生成报告
    async function generateReport() {
        const selectedEntries = conversationHistory.filter(entry => entry.selected);

        // 创建一个新的列表，用于保持顺序
        const reportList = [];

        selectedEntries.forEach(entry => {

            // 先加入 question
            reportList.push(entry.question);

            const pdDataStr = JSON.stringify(entry.pd_data);  // 将 pd_data 转换为字符串
            const summaryStr = entry.summary;  // summary 已经是字符串

            // 合并 pd_data 和 summary，形成一个字符串
            const pdSummaryStr = `查到的数据表: ${pdDataStr}\n数据表的总结: ${summaryStr}`;

            // 将合并后的字符串添加到 reportList
            reportList.push(pdSummaryStr);

        });

        // 后端接口调用，传递报告列表生成文档
        const response = await fetch('/api/v0/generate_word', {
            method: 'POST',
            body: JSON.stringify({reportList}),
            headers: {'Content-Type': 'application/json'}
        });

        if (response.ok) {
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = '财务分析报告.docx';
            link.click();
        }

        // 隐藏确认框和勾选框
        showConfirm = false;
        showCheckbox = false;
    }

    async function generatePPT() {
        const selectedEntries = conversationHistory.filter(entry => entry.selected);

        // 创建一个新的列表，用于保持顺序
        const reportList = [];

        selectedEntries.forEach(entry => {

            // 先加入 question
            reportList.push(entry.question);

            const pdDataStr = JSON.stringify(entry.pd_data);  // 将 pd_data 转换为字符串
            const summaryStr = entry.summary;  // summary 已经是字符串

            // 合并 pd_data 和 summary，形成一个字符串
            const pdSummaryStr = `查到的数据表: ${pdDataStr}\n数据表的总结: ${summaryStr}`;

            // 将合并后的字符串添加到 reportList
            reportList.push(pdSummaryStr);

        });

        // 后端接口调用，传递报告列表生成文档
        const response = await fetch('/api/v0/generate_PPT', {
            method: 'POST',
            body: JSON.stringify({reportList}),
            headers: {'Content-Type': 'application/json'}
        });

        if (response.ok) {
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = '财务分析报告.pptx';
            link.click();
        }


        // 隐藏确认框和勾选框
        showConfirm_ppt = false;
        showCheckbox = false;
    }

</script>

<main>
    <div id="application-sidebar"
         class="hs-overlay hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform hidden fixed top-0 left-0 bottom-0 z-[60] w-64 bg-white border-r border-gray-200 overflow-y-auto scrollbar-y lg:block lg:translate-x-0 lg:right-auto lg:bottom-0 dark:scrollbar-y dark:bg-slate-900 dark:border-gray-700">
        <nav class="hs-accordion-group w-full h-full flex flex-col" data-hs-accordion-always-open="">
            <div class="flex items-center justify-between py-4 pr-4 pl-7"><img class="w-35 h-auto"
                                                                               src="assets/img.png"
                                                                               alt="Vanna Logo">
                <div class="lg:hidden">
                    <button type="button"
                            class="w-8 h-8 inline-flex justify-center items-center gap-2 rounded-md text-gray-700 align-middle focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all dark:text-gray-400 dark:focus:ring-offset-gray-800"
                            data-hs-overlay="#application-sidebar" aria-controls="application-sidebar"
                            aria-label="Toggle navigation">
                        <svg class="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"></path>
                        </svg>
                        <span class="sr-only">Sidebar</span></button>
                </div>
            </div>
            <div class="h-full">
                <ul class="space-y-1.5 p-4">
                    <li>
                        <button class="flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 border-t border-b border-gray-200 dark:border-gray-700 w-full"
                                on:click={() => switchView('trainingData')}>
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="1.5"
                                 viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5">
                                </path>
                            </svg>
                            训练数据
                        </button>
                    </li>
                    <li>
                        <button class="flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300"
                                on:click={() => switchView('default')}>
                            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                 fill="currentColor" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                      d="M8 2C8.47339 2 8.85714 2.38376 8.85714 2.85714V7.14286L13.1429 7.14286C13.6162 7.14286 14 7.52661 14 8C14 8.47339 13.6162 8.85714 13.1429 8.85714L8.85714 8.85715V13.1429C8.85714 13.6162 8.47339 14 8 14C7.52661 14 7.14286 13.6162 7.14286 13.1429V8.85715L2.85714 8.85715C2.38376 8.85715 2 8.4734 2 8.00001C2 7.52662 2.38376 7.14287 2.85714 7.14287L7.14286 7.14286V2.85714C7.14286 2.38376 7.52661 2 8 2Z"
                                      fill="currentColor"></path>
                            </svg>
                            新的提问
                        </button>
                    </li>
                    <!-- 生成报告按钮 -->
                    <li class="relative"> <!-- 相对定位，确保模态框基于按钮定位 -->
                        <button class="flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300"
                                on:click={showReportConfirm}>
                            <!-- 文档图标 -->
                            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                 fill="currentColor" viewBox="0 0 16 16">
                                <path d="M12.5 0h-9A1.5 1.5 0 0 0 2 1.5v13A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5V1.5A1.5 1.5 0 0 0 12.5 0zM8 13.5a.5.5 0 0 1-.5-.5V9H5a.5.5 0 0 1 0-1h2.5V5a.5.5 0 0 1 1 0v2h2.5a.5.5 0 0 1 0 1H8V13a.5.5 0 0 1-.5.5z"></path>
                            </svg>
                            生成报告
                        </button>
                        {#if showConfirm}

                            <!-- 模态框：确认生成报告 -->
                            <p class="text-center text-lg mb-4">确认生成报告？</p>

                            <!-- 按钮容器，居中并增加按钮间距 -->
                            <div class="flex justify-center gap-x-1 w-full">
                                <button class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200"
                                        on:click={generateReport}>
                                    确定
                                </button>

                                <!-- 取消按钮 -->
                                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition duration-200"
                                        on:click={cancelReport}>
                                    取消
                                </button>
                            </div>
                        {/if}

                    </li>
                    <!-- 生成PPT按钮 -->
                    <li class="relative"> <!-- 相对定位，确保模态框基于按钮定位 -->
                        <button class="flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300"
                                on:click={showReportConfirm_ppt}>
                            <!-- 文档图标 -->
                            <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                 fill="currentColor" viewBox="0 0 16 16">
                                <path d="M12.5 0h-9A1.5 1.5 0 0 0 2 1.5v13A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5V1.5A1.5 1.5 0 0 0 12.5 0zM8 13.5a.5.5 0 0 1-.5-.5V9H5a.5.5 0 0 1 0-1h2.5V5a.5.5 0 0 1 1 0v2h2.5a.5.5 0 0 1 0 1H8V13a.5.5 0 0 1-.5.5z"></path>
                            </svg>
                            生成PPT
                        </button>
                        {#if showConfirm_ppt}

                            <!-- 模态框：确认生成报告 -->
                            <p class="text-center text-lg mb-4">确认生成PPT？</p>

                            <!-- 按钮容器，居中并增加按钮间距 -->
                            <div class="flex justify-center gap-x-1 w-full">
                                <button class="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200"
                                        on:click={generatePPT}>
                                    确定
                                </button>

                                <!-- 取消按钮 -->
                                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition duration-200"
                                        on:click={cancelReport_ppt}>
                                    取消
                                </button>
                            </div>
                        {/if}

                    </li>
                    <li>
                        <!-- 状态切换开关按钮 -->
                        <div
                                class="flex items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300 border-t border-b border-gray-200 dark:border-gray-700 w-full"
                                on:click={toggleMode}
                        >
                            <div class="mode-text {mode === 'database' ? 'active' : ''}">数据库</div>
                            <div class="toggle-switch">
                                <div class="toggle-ball {mode === 'database' ? 'left' : 'right'}"></div>
                            </div>
                            <div class="mode-text {mode === 'file' ? 'active' : ''}">文件</div>
                        </div>
                    </li>


                </ul>
            </div>
            <div class="mt-auto">
                <div class="py-2.5 px-7"><p
                        class="inline-flex items-center gap-x-2 text-xs text-green-600"><span
                        class="block w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    已登录</p></div>
                <div class="p-4 border-t border-gray-200 dark:border-gray-700"><a
                        class="flex justify-between items-center gap-x-3 py-2 px-3 text-sm text-slate-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-slate-400 dark:hover:text-slate-300"
                        href="#replace">注销
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                         fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd"
                              d="M10 3.5a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 1 9.5 14h-8A1.5 1.5 0 0 1 0 12.5v-9A1.5 1.5 0 0 1 1.5 2h8A1.5 1.5 0 0 1 11 3.5v2a.5.5 0 0 1-1 0v-2z"></path>
                        <path fill-rule="evenodd"
                              d="M4.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H14.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3z"></path>
                    </svg>
                </a></div>
            </div>
        </nav>
    </div>
    <!-- 切换的内容 -->
    {#if currentView === 'trainingData'}
        <div class="relative h-screen w-full lg:pl-64">
            <!-- 您的训练数据内容 -->
            <div class="py-10 lg:py-14">
                <div class="max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto">
                    <div class="flex flex-col">
                        <div class="-m-1.5 overflow-x-auto">
                            <div class="p-1.5 min-w-full inline-block align-middle">
                                <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-gray-700">
                                    <div class="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-b border-gray-200 dark:border-gray-700">
                                        <div>
                                            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                                Training Data</h2>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                                添加或删除训练数据。良好的训练数据是准确性的关键。</p>
                                        </div>
                                        <div>
                                            <div class="inline-flex gap-x-2">
                                                <button class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
                                                    View all
                                                </button>
                                                <button class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800">
                                                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg"
                                                         width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                        <path d="M2.63452 7.50001L13.6345 7.5M8.13452 13V2"
                                                              stroke="currentColor" stroke-width="2"
                                                              stroke-linecap="round"></path>
                                                    </svg>
                                                    添加训练数据
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead class="bg-gray-50 dark:bg-slate-800">
                                        <tr>
                                            <th scope="col" class="px-6 py-3 text-left">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">Action</span>
                                                </div>
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">Question</span>
                                                </div>
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">Content</span>
                                                </div>
                                            </th>
                                            <th scope="col" class="px-6 py-3 text-left">
                                                <div class="flex items-center gap-x-2">
                                                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">Training Data Type</span>
                                                </div>
                                            </th>
                                        </tr>
                                        </thead>
                                        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                        <!-- 这里添加数据行 -->

                                        {#each trainingData as item}
                                            <tr>
                                                <td class="h-px w-px">
                                                    <div class="px-6 py-3">
                                                        <button type="button"
                                                                class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border-2 border-red-200 font-semibold text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
                                                                on:click={() => deleteItem(item.id)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                                <td class="h-px w-px">
                                                    <div class="px-6 py-3">
                                                        <span class="text-gray-800 dark:text-gray-200">{item.question}</span>
                                                    </div>
                                                </td>
                                                <td class="h-px w-px">
                                                    <div class="px-6 py-3">
                                                        <span class="text-gray-800 dark:text-gray-200">{item.content}</span>
                                                    </div>
                                                </td>
                                                <td class="h-px w-px">
                                                    <div class="px-6 py-3">
                                                        <span class="text-gray-800 dark:text-gray-200">{item.training_data_type}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        {/each}
                                        </tbody>
                                    </table>
                                    <div class="px-6 py-4 grid gap-3 md:flex md:justify-between md:items-center border-t border-gray-200 dark:border-gray-700">
                                        <div class="inline-flex items-center gap-x-2">
                                            <p class="text-sm text-gray-600 dark:text-gray-400">Showing:</p>
                                            <div class="max-w-sm space-y-3">
                                                <span class="py-2 px-3 pr-9 block w-full border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400">1 - 10</span>
                                            </div>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">of 25</p>
                                        </div>
                                        <div>
                                            <!-- 分页按钮 -->
                                            <div class="inline-flex gap-x-2">
                                                <button type="button"
                                                        class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
                                                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg"
                                                         width="16" height="16" fill="currentColor"
                                                         viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"></path>
                                                    </svg>
                                                    Prev
                                                </button>
                                                <button type="button"
                                                        class="py-2 px-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
                                                    Next
                                                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg"
                                                         width="16" height="16" fill="currentColor"
                                                         viewBox="0 0 16 16">
                                                        <path fill-rule="evenodd"
                                                              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <div id="chat-container" class="relative  w-full lg:pl-64">
            <div class="py-10 lg:py-14">
                <div class="max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto text-center"><h1
                        class="text-3xl font-bold text-gray-800 sm:text-4xl dark:text-white">欢迎使用财务AI系统</h1>
                    <p class="mt-3 text-gray-600 dark:text-gray-400">一个数据库助手</p></div>
                {#if talk === false}
                    <li class="max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4"><img
                            src="/vanna.png"
                            class="flex-shrink-0 w-[2.375rem] h-[2.375rem] "
                            alt="agent logo">
                        <div class="space-y-3 overflow-x-auto overflow-y-hidden">
                            <p class="text-gray-800 dark:text-gray-200"> {header}
                                {#each load_questions as question}
                                    <button type="button"
                                            class="mb-2.5 mr-1.5 py-2 px-3 inline-flex justify-center items-center gap-x-2 rounded-md border border-blue-600 bg-white text-blue-600 align-middle hover:bg-blue-50 text-sm dark:bg-slate-900 dark:text-blue-500 dark:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400">
                                        {question}
                                    </button>
                                {/each}
                            </p>
                        </div>
                    </li>
                {:else }
                    <ul class="mt-16 space-y-5">
                        {#each conversationHistory as entry (entry.id)}
                            <li class="py-2 sm:py-4">
                                <div class="max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto">
                                    <div class="max-w-2xl flex gap-x-2 sm:gap-x-4"><span
                                            class="flex-shrink-0 inline-flex items-center justify-center h-[2.375rem] w-[2.375rem] rounded-full bg-gray-600"><span
                                            class="text-sm font-medium text-white leading-none">你</span></span>
                                        <div class="grow mt-2 space-y-3"><p
                                                class="text-gray-800 dark:text-gray-200">
                                            {entry.question}</p></div>
                                    </div>
                                    <!-- 勾选框, 只有在showCheckbox为true时才显示 -->
                                    {#if showCheckbox}
                                        <input type="checkbox" bind:checked={entry.selected} class="ml-4"/>
                                    {/if}
                                </div>
                            </li>
                            {#if !entry.show_response }
                                <li class="max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4"><img
                                        src="/vanna.png" class="flex-shrink-0 w-[2.375rem] h-[2.375rem] animate-bounce "
                                        alt="agent logo">
                                    <div class="space-y-3">
                                        {#if response_timeout}
                                            <p class="text-red-600 dark:text-red-400">回答失败，请稍后重试。</p>
                                        {:else}
                                            <p class="text-gray-800 dark:text-gray-200">思考中...</p>
                                        {/if}
                                    </div>
                                </li>
                            {:else}
                                {#if !entry.show_pd}
                                    <li class="max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4"><img
                                            src="/vanna.png" class="flex-shrink-0 w-[2.375rem] h-[2.375rem] "
                                            alt="agent logo">
                                        <div class="space-y-3 overflow-x-auto overflow-y-hidden">
                                            <p class="text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                                                {entry.response}
                                            </p>
                                            <button type="button"
                                                    class="mb-2.5 mr-1.5 py-2 px-3 inline-flex justify-center items-center gap-x-2 rounded-md border border-blue-600 bg-white text-blue-600 align-middle hover:bg-blue-50 text-sm dark:bg-slate-900 dark:text-blue-500 dark:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400"
                                                    on:click={() => playText(entry.response)}>
                                                播放
                                            </button>
                                        </div>
                                    </li>
                                {/if}
                                {#if entry.show_pd}
                                    <li class="max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4">
                                        <img src="/vanna.png" class="flex-shrink-0 w-[2.375rem] h-[2.375rem] "
                                             alt="agent logo">
                                        <div class="space-y-3 overflow-x-auto overflow-y-hidden">
                                            <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-gray-700">
                                                <div class="overflow-x-auto overflow-y-auto" style="max-height:300px">
                                                    <div class="p-1.5 min-w-full inline-block align-middle ">
                                                        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                            <thead class="bg-gray-50 dark:bg-slate-800">
                                                            <tr>
                                                                {#each entry.tableHeaders as header}
                                                                    <th scope="col" class="px-6 py-3 text-left">
                                                                        <div class="flex items-center gap-x-2">
                                                                                    <span class="text-xs font-semibold uppercase tracking-wide text-gray-800 dark:text-gray-200">
                                                                                        {header}
                                                                                    </span>
                                                                        </div>
                                                                    </th>
                                                                {/each}
                                                            </tr>
                                                            </thead>
                                                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {#each entry.pd_data as row}
                                                                <tr>
                                                                    {#each entry.tableHeaders as header}
                                                                        <td class="h-px w-px whitespace-nowrap">
                                                                            <div class="px-6 py-3">
                                                                                        <span class="text-gray-800 dark:text-gray-200">
                                                                                            {row[header]}
                                                                                            <!-- 动态显示字段值 -->
                                                                                        </span>
                                                                            </div>
                                                                        </td>
                                                                    {/each}
                                                                </tr>
                                                            {/each}
                                                            </tbody>
                                                        </table>

                                                    </div>
                                                </div>
                                            </div>
                                            <ul class="flex flex-col justify-end text-start -space-y-px">
                                                <li class="flex items-center gap-x-2 p-3 text-sm bg-white border text-gray-800 first:rounded-t-lg first:mt-0 last:rounded-b-lg dark:bg-slate-900 dark:border-gray-700 dark:text-gray-200">
                                                    <div class="w-full flex justify-between truncate"><span
                                                            class="mr-3 flex-1 w-0 truncate">CSV</span> <a
                                                            class="flex items-center gap-x-2 text-gray-500 hover:text-blue-500 whitespace-nowrap"
                                                            href="/api/v0/download_csv?id={entry.id}">
                                                        <svg class="flex-shrink-0 w-3 h-3" width="16" height="16"
                                                             viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"></path>
                                                            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"></path>
                                                        </svg>
                                                        下载</a></div>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                    {#if entry.show_chart}
                                        <li class="max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4">
                                            <img src="/vanna.png" class="flex-shrink-0 w-[2.375rem] h-[2.375rem] "
                                                 alt="agent logo">
                                            <div id="chart-container-{entry.id}" class="chart-container"
                                                 style="height:400px;"
                                            ></div>
                                        </li>
                                        <li class="max-w-4xl py-2 px-4 sm:px-6 lg:px-8 mx-auto flex gap-x-2 sm:gap-x-4">
                                            <img
                                                    src="/vanna.png" class="flex-shrink-0 w-[2.375rem] h-[2.375rem] "
                                                    alt="agent logo">
                                            <div class="space-y-3 overflow-x-auto overflow-y-hidden">
                                                <p class="text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                                                    {entry.summary || "此次查询没有得出结论"}
                                                </p>
                                                <button type="button"
                                                        class="mb-2.5 mr-1.5 py-2 px-3 inline-flex justify-center items-center gap-x-2 rounded-md border border-blue-600 bg-white text-blue-600 align-middle hover:bg-blue-50 text-sm dark:bg-slate-900 dark:text-blue-500 dark:border-blue-500 dark:hover:text-blue-400 dark:hover:border-blue-400"
                                                        on:click={() => playText(entry.summary || "此次查询没有得出结论")}>
                                                    播放
                                                </button>
                                            </div>
                                        </li>

                                    {/if}
                                {/if}
                            {/if}


                        {/each}
                    </ul>
                {/if}
            </div>

            <footer class="max-w-4xl mx-auto sticky bottom-0 z-10 p-3 sm:py-6">

                <div class="relative "><input type="text"
                                              bind:value={questionInput}
                                              on:keydown={handleKeyDown}
                                              class="p-4 pb-12 block w-full bg-gray-100 border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:border-gray-700 dark:text-gray-400"
                                              placeholder="向我询问有关您的数据的问题，我可以将其转换为 SQL。">
                    <div class="absolute bottom-px  inset-x-px p-2 rounded-b-md bg-gray-100 dark:bg-slate-800">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center"></div>
                            <div class="flex items-center gap-x-1">
                                <button
                                        type="button"
                                        class="inline-flex flex-shrink-0 justify-center items-center size-8 rounded-lg text-gray-500 hover:text-blue-600 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:text-blue-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
                                        on:click={startSpeechRecognition}>
                                    <svg class="flex-shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24"
                                         height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                        <line x1="12" x2="12" y1="19" y2="22"></line>
                                    </svg>
                                </button>
                                <button type="button"
                                        on:click={handleGenerateSQL}
                                        class="inline-flex flex-shrink-0 justify-center items-center h-8 w-8 rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" width="16"
                                         height="16"
                                         fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>

    {/if}

</main>

<style>
    .nav-title {
        font-family: Roboto Slab, serif
    }

    *, :before, :after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: #e5e7eb
    }

    :before, :after {
        --tw-content: ""
    }

    html {
        line-height: 1.5;
        -webkit-text-size-adjust: 100%;
        -moz-tab-size: 4;
        -o-tab-size: 4;
        tab-size: 4;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", Segoe UI Symbol, "Noto Color Emoji";
        font-feature-settings: normal;
        font-variation-settings: normal
    }

    body {
        margin: 0;
        line-height: inherit
    }

    hr {
        height: 0;
        color: inherit;
        border-top-width: 1px
    }

    abbr:where([title]) {
        -webkit-text-decoration: underline dotted;
        text-decoration: underline dotted
    }

    h1, h2, h3, h4, h5, h6 {
        font-size: inherit;
        font-weight: inherit
    }

    a {
        color: inherit;
        text-decoration: inherit
    }

    b, strong {
        font-weight: bolder
    }

    code, kbd, samp, pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
        font-size: 1em
    }

    small {
        font-size: 80%
    }

    sub, sup {
        font-size: 75%;
        line-height: 0;
        position: relative;
        vertical-align: baseline
    }

    sub {
        bottom: -.25em
    }

    sup {
        top: -.5em
    }

    table {
        text-indent: 0;
        border-color: inherit;
        border-collapse: collapse
    }

    button, input, optgroup, select, textarea {
        font-family: inherit;
        font-feature-settings: inherit;
        font-variation-settings: inherit;
        font-size: 100%;
        font-weight: inherit;
        line-height: inherit;
        color: inherit;
        margin: 0;
        padding: 0
    }

    button, select {
        text-transform: none
    }

    button, [type=button], [type=reset], [type=submit] {
        -webkit-appearance: button;
        background-color: transparent;
        background-image: none
    }

    :-moz-focusring {
        outline: auto
    }

    :-moz-ui-invalid {
        box-shadow: none
    }

    progress {
        vertical-align: baseline
    }

    ::-webkit-inner-spin-button, ::-webkit-outer-spin-button {
        height: auto
    }

    [type=search] {
        -webkit-appearance: textfield;
        outline-offset: -2px
    }

    ::-webkit-search-decoration {
        -webkit-appearance: none
    }

    ::-webkit-file-upload-button {
        -webkit-appearance: button;
        font: inherit
    }

    summary {
        display: list-item
    }

    blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre {
        margin: 0
    }

    fieldset {
        margin: 0;
        padding: 0
    }

    legend {
        padding: 0
    }

    ol, ul, menu {
        list-style: none;
        margin: 0;
        padding: 0
    }

    dialog {
        padding: 0
    }

    textarea {
        resize: vertical
    }

    input::-moz-placeholder, textarea::-moz-placeholder {
        opacity: 1;
        color: #9ca3af
    }

    input::placeholder, textarea::placeholder {
        opacity: 1;
        color: #9ca3af
    }

    button, [role=button] {
        cursor: pointer
    }

    :disabled {
        cursor: default
    }

    img, svg, video, canvas, audio, iframe, embed, object {
        display: block;
        vertical-align: middle
    }

    img, video {
        max-width: 100%;
        height: auto
    }

    [hidden] {
        display: none
    }

    *, :before, :after {
        --tw-border-spacing-x: 0;
        --tw-border-spacing-y: 0;
        --tw-translate-x: 0;
        --tw-translate-y: 0;
        --tw-rotate: 0;
        --tw-skew-x: 0;
        --tw-skew-y: 0;
        --tw-scale-x: 1;
        --tw-scale-y: 1;
        --tw-pan-x: ;
        --tw-pan-y: ;
        --tw-pinch-zoom: ;
        --tw-scroll-snap-strictness: proximity;
        --tw-gradient-from-position: ;
        --tw-gradient-via-position: ;
        --tw-gradient-to-position: ;
        --tw-ordinal: ;
        --tw-slashed-zero: ;
        --tw-numeric-figure: ;
        --tw-numeric-spacing: ;
        --tw-numeric-fraction: ;
        --tw-ring-inset: ;
        --tw-ring-offset-width: 0px;
        --tw-ring-offset-color: #fff;
        --tw-ring-color: rgb(59 130 246 / .5);
        --tw-ring-offset-shadow: 0 0 #0000;
        --tw-ring-shadow: 0 0 #0000;
        --tw-shadow: 0 0 #0000;
        --tw-shadow-colored: 0 0 #0000;
        --tw-blur: ;
        --tw-brightness: ;
        --tw-contrast: ;
        --tw-grayscale: ;
        --tw-hue-rotate: ;
        --tw-invert: ;
        --tw-saturate: ;
        --tw-sepia: ;
        --tw-drop-shadow: ;
        --tw-backdrop-blur: ;
        --tw-backdrop-brightness: ;
        --tw-backdrop-contrast: ;
        --tw-backdrop-grayscale: ;
        --tw-backdrop-hue-rotate: ;
        --tw-backdrop-invert: ;
        --tw-backdrop-opacity: ;
        --tw-backdrop-saturate: ;
        --tw-backdrop-sepia:
    }

    ::backdrop {
        --tw-border-spacing-x: 0;
        --tw-border-spacing-y: 0;
        --tw-translate-x: 0;
        --tw-translate-y: 0;
        --tw-rotate: 0;
        --tw-skew-x: 0;
        --tw-skew-y: 0;
        --tw-scale-x: 1;
        --tw-scale-y: 1;
        --tw-pan-x: ;
        --tw-pan-y: ;
        --tw-pinch-zoom: ;
        --tw-scroll-snap-strictness: proximity;
        --tw-gradient-from-position: ;
        --tw-gradient-via-position: ;
        --tw-gradient-to-position: ;
        --tw-ordinal: ;
        --tw-slashed-zero: ;
        --tw-numeric-figure: ;
        --tw-numeric-spacing: ;
        --tw-numeric-fraction: ;
        --tw-ring-inset: ;
        --tw-ring-offset-width: 0px;
        --tw-ring-offset-color: #fff;
        --tw-ring-color: rgb(59 130 246 / .5);
        --tw-ring-offset-shadow: 0 0 #0000;
        --tw-ring-shadow: 0 0 #0000;
        --tw-shadow: 0 0 #0000;
        --tw-shadow-colored: 0 0 #0000;
        --tw-blur: ;
        --tw-brightness: ;
        --tw-contrast: ;
        --tw-grayscale: ;
        --tw-hue-rotate: ;
        --tw-invert: ;
        --tw-saturate: ;
        --tw-sepia: ;
        --tw-drop-shadow: ;
        --tw-backdrop-blur: ;
        --tw-backdrop-brightness: ;
        --tw-backdrop-contrast: ;
        --tw-backdrop-grayscale: ;
        --tw-backdrop-hue-rotate: ;
        --tw-backdrop-invert: ;
        --tw-backdrop-opacity: ;
        --tw-backdrop-saturate: ;
        --tw-backdrop-sepia:
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0
    }

    .collapse {
        visibility: collapse
    }

    .static {
        position: static
    }

    .fixed {
        position: fixed
    }

    .absolute {
        position: absolute
    }

    .relative {
        position: relative
    }

    .sticky {
        position: sticky
    }

    .inset-0 {
        top: 0;
        right: 0;
        bottom: 0;
        left: 0
    }

    .inset-x-px {
        left: 1px;
        right: 1px
    }

    .bottom-0 {
        bottom: 0
    }

    .bottom-px {
        bottom: 1px
    }

    .left-0 {
        left: 0
    }

    .top-0 {
        top: 0
    }

    .z-10 {
        z-index: 10
    }

    .z-50 {
        z-index: 50
    }

    .z-\[60\] {
        z-index: 60
    }

    .-m-1 {
        margin: -.25rem
    }

    .-m-1\.5 {
        margin: -.375rem
    }

    .m-3 {
        margin: .75rem
    }

    .mx-auto {
        margin-left: auto;
        margin-right: auto
    }

    .mb-1 {
        margin-bottom: .25rem
    }

    .mb-2 {
        margin-bottom: .5rem
    }

    .mb-2\.5 {
        margin-bottom: .625rem
    }

    .ml-3 {
        margin-left: .75rem
    }

    .ml-4 {
        margin-left: 1rem
    }

    .mr-1 {
        margin-right: .25rem
    }

    .mr-1\.5 {
        margin-right: .375rem
    }

    .mr-3 {
        margin-right: .75rem
    }

    .mt-0 {
        margin-top: 0
    }

    .mt-0\.5 {
        margin-top: .125rem
    }

    .mt-1 {
        margin-top: .25rem
    }

    .mt-16 {
        margin-top: 4rem
    }

    .mt-2 {
        margin-top: .5rem
    }

    .mt-3 {
        margin-top: .75rem
    }

    .mt-5 {
        margin-top: 1.25rem
    }

    .mt-6 {
        margin-top: 1.5rem
    }

    .mt-auto {
        margin-top: auto
    }

    .block {
        display: block
    }

    .inline-block {
        display: inline-block
    }

    .inline {
        display: inline
    }

    .flex {
        display: flex
    }

    .inline-flex {
        display: inline-flex
    }

    .table {
        display: table
    }

    .grid {
        display: grid
    }

    .hidden {
        display: none
    }

    .h-1 {
        height: .25rem
    }

    .h-1\.5 {
        height: .375rem
    }

    .h-3 {
        height: .75rem
    }

    .h-3\.5 {
        height: .875rem
    }

    .h-4 {
        height: 1rem
    }

    .h-5 {
        height: 1.25rem
    }

    .h-6 {
        height: 1.5rem
    }

    .h-7 {
        height: 1.75rem
    }

    .h-8 {
        height: 2rem
    }

    .h-\[2\.375rem\] {
        height: 2.375rem
    }

    .h-auto {
        height: auto
    }

    .h-full {
        height: 100%
    }

    .h-px {
        height: 1px
    }

    .h-screen {
        height: 100vh
    }

    .min-h-\[15rem\] {
        min-height: 15rem
    }

    .min-h-\[calc\(100\%-3\.5rem\)\] {
        min-height: calc(100% - 3.5rem)
    }

    .w-0 {
        width: 0px
    }

    .w-1 {
        width: .25rem
    }

    .w-1\.5 {
        width: .375rem
    }

    .w-28 {
        width: 7rem
    }

    .w-3 {
        width: .75rem
    }

    .w-3\.5 {
        width: .875rem
    }

    .w-4 {
        width: 1rem
    }

    .w-6 {
        width: 1.5rem
    }

    .w-64 {
        width: 16rem
    }

    .w-8 {
        width: 2rem
    }

    .w-\[2\.375rem\] {
        width: 2.375rem
    }

    .w-\[3\.25rem\] {
        width: 3.25rem
    }

    .w-full {
        width: 100%
    }

    .w-px {
        width: 1px
    }

    .min-w-full {
        min-width: 100%
    }

    .max-w-2xl {
        max-width: 42rem
    }

    .max-w-4xl {
        max-width: 56rem
    }

    .max-w-\[85rem\] {
        max-width: 85rem
    }

    .max-w-sm {
        max-width: 24rem
    }

    .flex-1 {
        flex: 1 1 0%
    }

    .flex-auto {
        flex: 1 1 auto
    }

    .flex-shrink-0, .shrink-0 {
        flex-shrink: 0
    }

    .grow {
        flex-grow: 1
    }

    .-translate-x-full {
        --tw-translate-x: -100%;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    .transform {
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    @keyframes bounce {
        0%, to {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(.8, 0, 1, 1)
        }
        50% {
            transform: none;
            animation-timing-function: cubic-bezier(0, 0, .2, 1)
        }
    }

    .animate-bounce {
        animation: bounce 1s infinite
    }

    @keyframes spin {
        to {
            transform: rotate(360deg)
        }
    }

    .animate-spin {
        animation: spin 1s linear infinite
    }

    .cursor-pointer {
        cursor: pointer
    }

    .resize {
        resize: both
    }

    .appearance-none {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none
    }

    .flex-col {
        flex-direction: column
    }

    .items-start {
        align-items: flex-start
    }

    .items-center {
        align-items: center
    }

    .justify-end {
        justify-content: flex-end
    }

    .justify-center {
        justify-content: center
    }

    .justify-between {
        justify-content: space-between
    }

    .gap-1 {
        gap: .25rem
    }

    .gap-1\.5 {
        gap: .375rem
    }

    .gap-2 {
        gap: .5rem
    }

    .gap-3 {
        gap: .75rem
    }

    .gap-x-1 {
        -moz-column-gap: .25rem;
        column-gap: .25rem
    }

    .gap-x-2 {
        -moz-column-gap: .5rem;
        column-gap: .5rem
    }

    .gap-x-3 {
        -moz-column-gap: .75rem;
        column-gap: .75rem
    }

    .-space-y-px > :not([hidden]) ~ :not([hidden]) {
        --tw-space-y-reverse: 0;
        margin-top: calc(-1px * calc(1 - var(--tw-space-y-reverse)));
        margin-bottom: calc(-1px * var(--tw-space-y-reverse))
    }

    .space-y-1 > :not([hidden]) ~ :not([hidden]) {
        --tw-space-y-reverse: 0;
        margin-top: calc(.25rem * calc(1 - var(--tw-space-y-reverse)));
        margin-bottom: calc(.25rem * var(--tw-space-y-reverse))
    }

    .space-y-1\.5 > :not([hidden]) ~ :not([hidden]) {
        --tw-space-y-reverse: 0;
        margin-top: calc(.375rem * calc(1 - var(--tw-space-y-reverse)));
        margin-bottom: calc(.375rem * var(--tw-space-y-reverse))
    }

    .space-y-3 > :not([hidden]) ~ :not([hidden]) {
        --tw-space-y-reverse: 0;
        margin-top: calc(.75rem * calc(1 - var(--tw-space-y-reverse)));
        margin-bottom: calc(.75rem * var(--tw-space-y-reverse))
    }

    .space-y-5 > :not([hidden]) ~ :not([hidden]) {
        --tw-space-y-reverse: 0;
        margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse)));
        margin-bottom: calc(1.25rem * var(--tw-space-y-reverse))
    }

    .divide-y > :not([hidden]) ~ :not([hidden]) {
        --tw-divide-y-reverse: 0;
        border-top-width: calc(1px * calc(1 - var(--tw-divide-y-reverse)));
        border-bottom-width: calc(1px * var(--tw-divide-y-reverse))
    }

    .divide-gray-200 > :not([hidden]) ~ :not([hidden]) {
        --tw-divide-opacity: 1;
        border-color: rgb(229 231 235 / var(--tw-divide-opacity))
    }

    .overflow-hidden {
        overflow: hidden
    }

    .overflow-x-auto {
        overflow-x: auto
    }

    .overflow-y-auto {
        overflow-y: auto
    }

    .overflow-x-hidden {
        overflow-x: hidden
    }

    .overflow-y-hidden {
        overflow-y: hidden
    }

    .truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap
    }

    .whitespace-nowrap {
        white-space: nowrap
    }

    .whitespace-pre-wrap {
        white-space: pre-wrap
    }

    .rounded-full {
        border-radius: 9999px
    }

    .rounded-lg {
        border-radius: .5rem
    }

    .rounded-md {
        border-radius: .375rem
    }

    .rounded-xl {
        border-radius: .75rem
    }

    .rounded-b-md {
        border-bottom-right-radius: .375rem;
        border-bottom-left-radius: .375rem
    }

    .border {
        border-width: 1px
    }

    .border-2 {
        border-width: 2px
    }

    .border-\[3px\] {
        border-width: 3px
    }

    .border-b {
        border-bottom-width: 1px
    }

    .border-r {
        border-right-width: 1px
    }

    .border-t {
        border-top-width: 1px
    }

    .border-blue-600 {
        --tw-border-opacity: 1;
        border-color: rgb(37 99 235 / var(--tw-border-opacity))
    }

    .border-current {
        border-color: currentColor
    }

    .border-gray-200 {
        --tw-border-opacity: 1;
        border-color: rgb(229 231 235 / var(--tw-border-opacity))
    }

    .border-gray-300 {
        --tw-border-opacity: 1;
        border-color: rgb(209 213 219 / var(--tw-border-opacity))
    }

    .border-green-200 {
        --tw-border-opacity: 1;
        border-color: rgb(187 247 208 / var(--tw-border-opacity))
    }

    .border-red-200 {
        --tw-border-opacity: 1;
        border-color: rgb(254 202 202 / var(--tw-border-opacity))
    }

    .border-transparent {
        border-color: transparent
    }

    .border-yellow-200 {
        --tw-border-opacity: 1;
        border-color: rgb(254 240 138 / var(--tw-border-opacity))
    }

    .border-t-transparent {
        border-top-color: transparent
    }

    .bg-blue-500 {
        --tw-bg-opacity: 1;
        background-color: rgb(59 130 246 / var(--tw-bg-opacity))
    }

    .bg-blue-600 {
        --tw-bg-opacity: 1;
        background-color: rgb(37 99 235 / var(--tw-bg-opacity))
    }

    .bg-gray-100 {
        --tw-bg-opacity: 1;
        background-color: rgb(243 244 246 / var(--tw-bg-opacity))
    }

    .bg-gray-50 {
        --tw-bg-opacity: 1;
        background-color: rgb(249 250 251 / var(--tw-bg-opacity))
    }

    .bg-gray-600 {
        --tw-bg-opacity: 1;
        background-color: rgb(75 85 99 / var(--tw-bg-opacity))
    }

    .bg-gray-900 {
        --tw-bg-opacity: 1;
        background-color: rgb(17 24 39 / var(--tw-bg-opacity))
    }

    .bg-green-600 {
        --tw-bg-opacity: 1;
        background-color: rgb(22 163 74 / var(--tw-bg-opacity))
    }

    .bg-white {
        --tw-bg-opacity: 1;
        background-color: rgb(255 255 255 / var(--tw-bg-opacity))
    }

    .bg-yellow-50 {
        --tw-bg-opacity: 1;
        background-color: rgb(254 252 232 / var(--tw-bg-opacity))
    }

    .bg-opacity-50 {
        --tw-bg-opacity: .5
    }

    .p-1 {
        padding: .25rem
    }

    .p-1\.5 {
        padding: .375rem
    }

    .p-2 {
        padding: .5rem
    }

    .p-2\.5 {
        padding: .625rem
    }

    .p-3 {
        padding: .75rem
    }

    .p-4 {
        padding: 1rem
    }

    .px-3 {
        padding-left: .75rem;
        padding-right: .75rem
    }

    .px-4 {
        padding-left: 1rem;
        padding-right: 1rem
    }

    .px-6 {
        padding-left: 1.5rem;
        padding-right: 1.5rem
    }

    .px-7 {
        padding-left: 1.75rem;
        padding-right: 1.75rem
    }

    .py-10 {
        padding-top: 2.5rem;
        padding-bottom: 2.5rem
    }

    .py-2 {
        padding-top: .5rem;
        padding-bottom: .5rem
    }

    .py-2\.5 {
        padding-top: .625rem;
        padding-bottom: .625rem
    }

    .py-3 {
        padding-top: .75rem;
        padding-bottom: .75rem
    }

    .py-4 {
        padding-top: 1rem;
        padding-bottom: 1rem
    }

    .pb-12 {
        padding-bottom: 3rem
    }

    .pl-7 {
        padding-left: 1.75rem
    }

    .pr-4 {
        padding-right: 1rem
    }

    .pr-9 {
        padding-right: 2.25rem
    }

    .text-left {
        text-align: left
    }

    .text-center {
        text-align: center
    }

    .text-start {
        text-align: start
    }

    .align-middle {
        vertical-align: middle
    }

    .font-mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace
    }

    .text-2xl {
        font-size: 1.5rem;
        line-height: 2rem
    }

    .text-3xl {
        font-size: 1.875rem;
        line-height: 2.25rem
    }

    .text-sm {
        font-size: .875rem;
        line-height: 1.25rem
    }

    .text-xl {
        font-size: 1.25rem;
        line-height: 1.75rem
    }

    .text-xs {
        font-size: .75rem;
        line-height: 1rem
    }

    .font-bold {
        font-weight: 700
    }

    .font-medium {
        font-weight: 500
    }

    .font-semibold {
        font-weight: 600
    }

    .uppercase {
        text-transform: uppercase
    }

    .leading-none {
        line-height: 1
    }

    .tracking-wide {
        letter-spacing: .025em
    }

    .text-blue-600 {
        --tw-text-opacity: 1;
        color: rgb(37 99 235 / var(--tw-text-opacity))
    }

    .text-gray-500 {
        --tw-text-opacity: 1;
        color: rgb(107 114 128 / var(--tw-text-opacity))
    }

    .text-gray-600 {
        --tw-text-opacity: 1;
        color: rgb(75 85 99 / var(--tw-text-opacity))
    }

    .text-gray-700 {
        --tw-text-opacity: 1;
        color: rgb(55 65 81 / var(--tw-text-opacity))
    }

    .text-gray-800 {
        --tw-text-opacity: 1;
        color: rgb(31 41 55 / var(--tw-text-opacity))
    }

    .text-green-500 {
        --tw-text-opacity: 1;
        color: rgb(34 197 94 / var(--tw-text-opacity))
    }

    .text-green-600 {
        --tw-text-opacity: 1;
        color: rgb(22 163 74 / var(--tw-text-opacity))
    }

    .text-red-500 {
        --tw-text-opacity: 1;
        color: rgb(239 68 68 / var(--tw-text-opacity))
    }

    .text-slate-700 {
        --tw-text-opacity: 1;
        color: rgb(51 65 85 / var(--tw-text-opacity))
    }

    .text-white {
        --tw-text-opacity: 1;
        color: rgb(255 255 255 / var(--tw-text-opacity))
    }

    .text-yellow-400 {
        --tw-text-opacity: 1;
        color: rgb(250 204 21 / var(--tw-text-opacity))
    }

    .text-yellow-700 {
        --tw-text-opacity: 1;
        color: rgb(161 98 7 / var(--tw-text-opacity))
    }

    .text-yellow-800 {
        --tw-text-opacity: 1;
        color: rgb(133 77 14 / var(--tw-text-opacity))
    }

    .opacity-0 {
        opacity: 0
    }

    .shadow-sm {
        --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / .05);
        --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)
    }

    .ring-1 {
        --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
        --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
        box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)
    }

    .ring-transparent {
        --tw-ring-color: transparent
    }

    .ring-offset-white {
        --tw-ring-offset-color: #fff
    }

    .blur {
        --tw-blur: blur(8px);
        filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)
    }

    .filter {
        filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)
    }

    .transition {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;
        transition-timing-function: cubic-bezier(.4, 0, .2, 1);
        transition-duration: .15s
    }

    .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(.4, 0, .2, 1);
        transition-duration: .15s
    }

    .transition-colors {
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
        transition-timing-function: cubic-bezier(.4, 0, .2, 1);
        transition-duration: .15s
    }

    .duration-200 {
        transition-duration: .2s
    }

    .duration-300 {
        transition-duration: .3s
    }

    .ease-in-out {
        transition-timing-function: cubic-bezier(.4, 0, .2, 1)
    }

    .ease-out {
        transition-timing-function: cubic-bezier(0, 0, .2, 1)
    }

    .before\:inline-block:before {
        content: var(--tw-content);
        display: inline-block
    }

    .before\:h-6:before {
        content: var(--tw-content);
        height: 1.5rem
    }

    .before\:w-6:before {
        content: var(--tw-content);
        width: 1.5rem
    }

    .before\:translate-x-0:before {
        content: var(--tw-content);
        --tw-translate-x: 0px;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    .before\:transform:before {
        content: var(--tw-content);
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    .before\:rounded-full:before {
        content: var(--tw-content);
        border-radius: 9999px
    }

    .before\:bg-white:before {
        content: var(--tw-content);
        --tw-bg-opacity: 1;
        background-color: rgb(255 255 255 / var(--tw-bg-opacity))
    }

    .before\:shadow:before {
        content: var(--tw-content);
        --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / .1), 0 1px 2px -1px rgb(0 0 0 / .1);
        --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)
    }

    .before\:ring-0:before {
        content: var(--tw-content);
        --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
        --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
        box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)
    }

    .before\:transition:before {
        content: var(--tw-content);
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
        transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;
        transition-timing-function: cubic-bezier(.4, 0, .2, 1);
        transition-duration: .15s
    }

    .before\:duration-200:before {
        content: var(--tw-content);
        transition-duration: .2s
    }

    .before\:ease-in-out:before {
        content: var(--tw-content);
        transition-timing-function: cubic-bezier(.4, 0, .2, 1)
    }

    .first\:mt-0:first-child {
        margin-top: 0
    }

    .first\:rounded-t-lg:first-child {
        border-top-left-radius: .5rem;
        border-top-right-radius: .5rem
    }

    .last\:rounded-b-lg:last-child {
        border-bottom-right-radius: .5rem;
        border-bottom-left-radius: .5rem
    }

    .checked\:bg-blue-600:checked {
        --tw-bg-opacity: 1;
        background-color: rgb(37 99 235 / var(--tw-bg-opacity))
    }

    .checked\:bg-none:checked {
        background-image: none
    }

    .checked\:before\:translate-x-full:checked:before {
        content: var(--tw-content);
        --tw-translate-x: 100%;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    .checked\:before\:bg-blue-200:checked:before {
        content: var(--tw-content);
        --tw-bg-opacity: 1;
        background-color: rgb(191 219 254 / var(--tw-bg-opacity))
    }

    .hover\:border-green-500:hover {
        --tw-border-opacity: 1;
        border-color: rgb(34 197 94 / var(--tw-border-opacity))
    }

    .hover\:border-red-500:hover {
        --tw-border-opacity: 1;
        border-color: rgb(239 68 68 / var(--tw-border-opacity))
    }

    .hover\:bg-blue-50:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(239 246 255 / var(--tw-bg-opacity))
    }

    .hover\:bg-blue-500:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(59 130 246 / var(--tw-bg-opacity))
    }

    .hover\:bg-blue-600:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(37 99 235 / var(--tw-bg-opacity))
    }

    .hover\:bg-gray-100:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(243 244 246 / var(--tw-bg-opacity))
    }

    .hover\:bg-gray-50:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(249 250 251 / var(--tw-bg-opacity))
    }

    .hover\:bg-green-500:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(34 197 94 / var(--tw-bg-opacity))
    }

    .hover\:bg-red-500:hover {
        --tw-bg-opacity: 1;
        background-color: rgb(239 68 68 / var(--tw-bg-opacity))
    }

    .hover\:text-blue-500:hover {
        --tw-text-opacity: 1;
        color: rgb(59 130 246 / var(--tw-text-opacity))
    }

    .hover\:text-gray-400:hover {
        --tw-text-opacity: 1;
        color: rgb(156 163 175 / var(--tw-text-opacity))
    }

    .hover\:text-white:hover {
        --tw-text-opacity: 1;
        color: rgb(255 255 255 / var(--tw-text-opacity))
    }

    .focus\:z-10:focus {
        z-index: 10
    }

    .focus\:border-blue-500:focus {
        --tw-border-opacity: 1;
        border-color: rgb(59 130 246 / var(--tw-border-opacity))
    }

    .focus\:border-blue-600:focus {
        --tw-border-opacity: 1;
        border-color: rgb(37 99 235 / var(--tw-border-opacity))
    }

    .focus\:outline-none:focus {
        outline: 2px solid transparent;
        outline-offset: 2px
    }

    .focus\:ring-2:focus {
        --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
        --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
        box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000)
    }

    .focus\:ring-blue-500:focus {
        --tw-ring-opacity: 1;
        --tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity))
    }

    .focus\:ring-blue-600:focus {
        --tw-ring-opacity: 1;
        --tw-ring-color: rgb(37 99 235 / var(--tw-ring-opacity))
    }

    .focus\:ring-gray-400:focus {
        --tw-ring-opacity: 1;
        --tw-ring-color: rgb(156 163 175 / var(--tw-ring-opacity))
    }

    .focus\:ring-green-200:focus {
        --tw-ring-opacity: 1;
        --tw-ring-color: rgb(187 247 208 / var(--tw-ring-opacity))
    }

    .focus\:ring-red-200:focus {
        --tw-ring-opacity: 1;
        --tw-ring-color: rgb(254 202 202 / var(--tw-ring-opacity))
    }

    .focus\:ring-offset-2:focus {
        --tw-ring-offset-width: 2px
    }

    .focus\:ring-offset-white:focus {
        --tw-ring-offset-color: #fff
    }

    .open.hs-overlay-open\:mt-7 {
        margin-top: 1.75rem
    }

    .open.hs-overlay-open\:translate-x-0 {
        --tw-translate-x: 0px;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    .open.hs-overlay-open\:opacity-100 {
        opacity: 1
    }

    .open.hs-overlay-open\:duration-500 {
        transition-duration: .5s
    }

    .open .hs-overlay-open\:mt-7 {
        margin-top: 1.75rem
    }

    .open .hs-overlay-open\:translate-x-0 {
        --tw-translate-x: 0px;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
    }

    .open .hs-overlay-open\:opacity-100 {
        opacity: 1
    }

    .open .hs-overlay-open\:duration-500 {
        transition-duration: .5s
    }

    @media (prefers-color-scheme: dark) {
        .dark\:divide-gray-700 > :not([hidden]) ~ :not([hidden]) {
            --tw-divide-opacity: 1;
            border-color: rgb(55 65 81 / var(--tw-divide-opacity))
        }

        .dark\:border-blue-500 {
            --tw-border-opacity: 1;
            border-color: rgb(59 130 246 / var(--tw-border-opacity))
        }

        .dark\:border-gray-600 {
            --tw-border-opacity: 1;
            border-color: rgb(75 85 99 / var(--tw-border-opacity))
        }

        .dark\:border-gray-700 {
            --tw-border-opacity: 1;
            border-color: rgb(55 65 81 / var(--tw-border-opacity))
        }

        .dark\:bg-gray-700 {
            --tw-bg-opacity: 1;
            background-color: rgb(55 65 81 / var(--tw-bg-opacity))
        }

        .dark\:bg-gray-800 {
            --tw-bg-opacity: 1;
            background-color: rgb(31 41 55 / var(--tw-bg-opacity))
        }

        .dark\:bg-slate-800 {
            --tw-bg-opacity: 1;
            background-color: rgb(30 41 59 / var(--tw-bg-opacity))
        }

        .dark\:bg-slate-900 {
            --tw-bg-opacity: 1;
            background-color: rgb(15 23 42 / var(--tw-bg-opacity))
        }

        .dark\:bg-opacity-80 {
            --tw-bg-opacity: .8
        }

        .dark\:text-blue-500 {
            --tw-text-opacity: 1;
            color: rgb(59 130 246 / var(--tw-text-opacity))
        }

        .dark\:text-gray-200 {
            --tw-text-opacity: 1;
            color: rgb(229 231 235 / var(--tw-text-opacity))
        }

        .dark\:text-gray-300 {
            --tw-text-opacity: 1;
            color: rgb(209 213 219 / var(--tw-text-opacity))
        }

        .dark\:text-gray-400 {
            --tw-text-opacity: 1;
            color: rgb(156 163 175 / var(--tw-text-opacity))
        }

        .dark\:text-gray-500 {
            --tw-text-opacity: 1;
            color: rgb(107 114 128 / var(--tw-text-opacity))
        }

        .dark\:text-slate-400 {
            --tw-text-opacity: 1;
            color: rgb(148 163 184 / var(--tw-text-opacity))
        }

        .dark\:text-white {
            --tw-text-opacity: 1;
            color: rgb(255 255 255 / var(--tw-text-opacity))
        }

        .dark\:placeholder-gray-400::-moz-placeholder {
            --tw-placeholder-opacity: 1;
            color: rgb(156 163 175 / var(--tw-placeholder-opacity))
        }

        .dark\:placeholder-gray-400::placeholder {
            --tw-placeholder-opacity: 1;
            color: rgb(156 163 175 / var(--tw-placeholder-opacity))
        }

        .dark\:shadow-slate-700\/\[\.7\] {
            --tw-shadow-color: rgb(51 65 85 / .7);
            --tw-shadow: var(--tw-shadow-colored)
        }

        .dark\:before\:bg-gray-400:before {
            content: var(--tw-content);
            --tw-bg-opacity: 1;
            background-color: rgb(156 163 175 / var(--tw-bg-opacity))
        }

        .dark\:checked\:border-blue-500:checked {
            --tw-border-opacity: 1;
            border-color: rgb(59 130 246 / var(--tw-border-opacity))
        }

        .dark\:checked\:bg-blue-500:checked {
            --tw-bg-opacity: 1;
            background-color: rgb(59 130 246 / var(--tw-bg-opacity))
        }

        .dark\:checked\:bg-blue-600:checked {
            --tw-bg-opacity: 1;
            background-color: rgb(37 99 235 / var(--tw-bg-opacity))
        }

        .dark\:checked\:before\:bg-blue-200:checked:before {
            content: var(--tw-content);
            --tw-bg-opacity: 1;
            background-color: rgb(191 219 254 / var(--tw-bg-opacity))
        }

        .dark\:hover\:border-blue-400:hover {
            --tw-border-opacity: 1;
            border-color: rgb(96 165 250 / var(--tw-border-opacity))
        }

        .dark\:hover\:bg-gray-900:hover {
            --tw-bg-opacity: 1;
            background-color: rgb(17 24 39 / var(--tw-bg-opacity))
        }

        .dark\:hover\:bg-slate-800:hover {
            --tw-bg-opacity: 1;
            background-color: rgb(30 41 59 / var(--tw-bg-opacity))
        }

        .dark\:hover\:text-blue-400:hover {
            --tw-text-opacity: 1;
            color: rgb(96 165 250 / var(--tw-text-opacity))
        }

        .dark\:hover\:text-slate-300:hover {
            --tw-text-opacity: 1;
            color: rgb(203 213 225 / var(--tw-text-opacity))
        }

        .dark\:hover\:text-white:hover {
            --tw-text-opacity: 1;
            color: rgb(255 255 255 / var(--tw-text-opacity))
        }

        .dark\:focus\:border-blue-500:focus {
            --tw-border-opacity: 1;
            border-color: rgb(59 130 246 / var(--tw-border-opacity))
        }

        .dark\:focus\:ring-blue-500:focus {
            --tw-ring-opacity: 1;
            --tw-ring-color: rgb(59 130 246 / var(--tw-ring-opacity))
        }

        .dark\:focus\:ring-gray-700:focus {
            --tw-ring-opacity: 1;
            --tw-ring-color: rgb(55 65 81 / var(--tw-ring-opacity))
        }

        .dark\:focus\:ring-offset-gray-800:focus {
            --tw-ring-offset-color: #1f2937
        }
    }

    @media (min-width: 640px) {
        .sm\:mx-auto {
            margin-left: auto;
            margin-right: auto
        }

        .sm\:mb-3 {
            margin-bottom: .75rem
        }

        .sm\:mt-10 {
            margin-top: 2.5rem
        }

        .sm\:w-full {
            width: 100%
        }

        .sm\:max-w-lg {
            max-width: 32rem
        }

        .sm\:gap-x-4 {
            -moz-column-gap: 1rem;
            column-gap: 1rem
        }

        .sm\:p-4 {
            padding: 1rem
        }

        .sm\:px-6 {
            padding-left: 1.5rem;
            padding-right: 1.5rem
        }

        .sm\:py-4 {
            padding-top: 1rem;
            padding-bottom: 1rem
        }

        .sm\:py-6 {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem
        }

        .sm\:text-3xl {
            font-size: 1.875rem;
            line-height: 2.25rem
        }

        .sm\:text-4xl {
            font-size: 2.25rem;
            line-height: 2.5rem
        }
    }

    @media (min-width: 768px) {
        .md\:flex {
            display: flex
        }

        .md\:items-center {
            align-items: center
        }

        .md\:justify-between {
            justify-content: space-between
        }

        .md\:p-10 {
            padding: 2.5rem
        }

        .md\:p-5 {
            padding: 1.25rem
        }
    }

    @media (min-width: 1024px) {
        .lg\:bottom-0 {
            bottom: 0
        }

        .lg\:right-auto {
            right: auto
        }

        .lg\:block {
            display: block
        }

        .lg\:hidden {
            display: none
        }

        .lg\:translate-x-0 {
            --tw-translate-x: 0px;
            transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skew(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))
        }

        .lg\:px-8 {
            padding-left: 2rem;
            padding-right: 2rem
        }

        .lg\:py-14 {
            padding-top: 3.5rem;
            padding-bottom: 3.5rem
        }

        .lg\:pl-64 {
            padding-left: 16rem
        }
    }

    /* 开关按钮容器样式 */
    .toggle-switch {
        width: 40px;
        height: 20px;
        background-color: #4caf50; /* 浅灰色背景 */
        border-radius: 20px;
        padding: 2px;
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        border: 1px solid #d1d5db;
    }

    /* 白色的小球 */
    .toggle-ball {
        width: 16px;
        height: 16px;
        background-color: #ffffff; /* 白色小球 */
        border-radius: 50%;
        position: absolute;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 添加阴影效果 */
    }

    /* 小球位置 */
    .toggle-ball.left {
        left: 2px;
    }

    .toggle-ball.right {
        right: 2px;
    }

    /* 模式文本样式 */
    .mode-text {
        font-size: 14px;
        color: #2d3748;
        flex: 1;
        text-align: center;
    }

    .active {
        font-weight: bold;
        color: #1a202c;
    }


</style>


