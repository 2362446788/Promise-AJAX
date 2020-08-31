
(function anonymous() {

    // 判断是否为对象
    let isObj = function isObj(val) {
        return val !== null && typeof val === 'object';
    };

    // 判断是否有 ？
    let char = function char(url) {
        return url.includes('?') ? "&" : "?";
    }

    // == AJAX核心处理
    class MyAJAX {
        constructor(options) {
            this.config = options;
            this.ISGET = /^(GET|DELETE|HEAD|OPTIONS)$/i.test(options.methods);
            return this.init();
        }

        init() {
            // 返回一个promise实例
            return new Promise((resolve, reject) => {

                // 配置请求拦截器
                let transformRequest = this.config.transformRequest;
                if (typeof transformRequest === 'function') {
                    this.config = transformRequest(this.config);
                }

                let {
                    methods,
                    validateStatus,
                    transformResponse,
                    withCredentials
                } = this.config;

                // 添加响应拦截器
                !Array.isArray(transformResponse) ? transformResponse = [null, null] : null;
                // 获取url
                let xhr = new XMLHttpRequest;
                xhr.open(methods, this.handleURL());
                //设值请求头
                this.handleHeaders(xhr);
                xhr.withCredentials = withCredentials;
                xhr.onreadystatechange = () => {
                    // 当状态值为2的时候说明响应头信息返回来了，这时候判断状态码是否成功，不成功返回reject
                    if (xhr.readyState === 2) {
                        let flag = validateStatus(xhr.status);
                        if (!flag) {
                            reject(this.handleResult(xhr, false));
                            return;
                        }
                    }
                    if (xhr.readyState === 4) {
                        resolve(this.handleResult(xhr, true))
                    }
                };
                xhr.send(this.handleData());
            }).then(...this.config.transformResponse)
        }

        // 处理url cache和params
        handleURL() {
            let {
                url,
                baseURL,
                cache,
                params
            } = this.config;

            url = baseURL + url;
            if (this.ISGET) {
                if (isObj(params)) {
                    let paramsText = ``;
                    for (let key in params) {
                        if (!params.hasOwnProperty(key)) break;
                        paramsText += `&${key}=${params[key]}`;
                    }
                    paramsText = paramsText.substring(1);
                    url += char(url) + paramsText;
                }
                if (cache === false) {
                    url += `${char(url)}_=${new Date().getTime()}`;
                }
            }
            return url;
        }

        // 设置请求头
        handleHeaders(xhr) {
            let headers = this.config.headers;
            if (isObj(headers)) {
                for (let key in headers) {
                    if (!headers.hasOwnProperty(key)) break;
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
        }

        // 设置主体信息
        handleData() {
            if (this.ISGET) return null;
            let data = this.config.data;
            if (isObj(data)) {
                // 默认传递的是JSON字符串
                data = JSON.stringify(data);
            }
            return data;
        }

        // 获取响应信息
        handleResult(xhr, flag) {
            let headers = {};
            // 把获取到的响应头信息转换为对象格式
            xhr.getAllResponseHeaders().split(/(?:\n|\r)/g).filter(item => item.length > 0).forEach(item => {
                let [key, value = ''] = item.split(': ');
                key ? headers[key] = value : null;
            })
            if (flag) {
                let data = xhr.responseText;
                let responseType = this.config.responseType;
                switch (responseType) {
                    case "json":
                        data = JSON.parse(data);
                        break;
                    case "xml":
                        data = xhr.responseXML;
                        break;
                }
                return {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    config: this.config,
                    request: xhr,
                    headers,
                    data
                }
            }
            return {
                status: xhr.status,
                statusText: xhr.statusText,
                config: this.config,
                request: xhr,
                headers
            }
        }
    }

    // 修改默认配置
    function initParams(options) {
        // 将参数合并，注意headers需要深层次合并
        !isObj(_ajax.defaults.headers) ? _ajax.defaults.headers = {} : null;
        !isObj(options.headers) ? options.headers = {} : null;
        options.headers = Object.assign(_ajax.defaults.headers, options.headers);
        return Object.assign(_ajax.defaults, options);
    }

    /* ===将ajax暴露到全局=== */
    function _ajax(options) {
        options = initParams(options);
        // 返回一个promise实例
        return new MyAJAX(options);
    }
    _ajax.defaults = {
        methods: '',
        url: '',
        baseURL: '',
        responseType: 'json',
        withCredentials: false,
        cache: true,
        data: null,
        params: null,
        headers: {
            "Content-Type": "application/json"
        },
        transformRequest: null,
        transformResponse: null,
        validateStatus: (status) => {
            return status >= 200 && status < 300;
        }
    };


    ['get', 'delete', 'head', 'options'].forEach(item => {
        _ajax[item] = function (url, options = {}) {
            options.url = url;
            options.methods = item;
            options = initParams(options);
            return new MyAJAX(options);
        }
    });

    ['post', 'put'].forEach(item => {
        _ajax[item] = function (url, data = {}, options = {}) {
            options.url = url;
            options.methods = item;
            options.data = data;
            options = initParams(options);
            return new MyAJAX(options);
        }
    })
    window._ajax = _ajax;
})()

