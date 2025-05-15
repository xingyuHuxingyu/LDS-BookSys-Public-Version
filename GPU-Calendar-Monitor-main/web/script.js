const appConfig = {
    data()
    {
        return {
            intervalId: null,
            nodes: [],
            dateList: [],
            illegalUsers: [],
            errorLegend: [
                { class: 'illegal_booking', text: '账号名错误 (确保与服务器的账号一致，如huxy，不要添加多余的字符)' },
                { class: 'illegal_maxgpu', text: '超过GPU使用限额 (所有机器的GPU预约总量超出24个算力单元的限额,或总预约超过8张不同的卡)' },
                { class: 'illegal_maxday', text: '单卡超过连续最大使用天数 (3) ' }
            ],
            subcalendarIds: {
                "teamup_calendar_id":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id2":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id3":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id4":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id5":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id6":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id7":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id8":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8],
                "teamup_calendar_id9":[subcalendarIds1, subcalendarIds2, subcalendarIds3, subcalendarIds4, subcalendarIds5, subcalendarIds6, subcalendarIds7, subcalendarIds8]
               
            },
            nodeNames: [
                "han5",
                "sui1",
                "sui2",
                "sui3",
                "sui4",
                "sui5",
                "tang1",
                "tang2",
                "tang3",
                "song1",
                "song2"
            ]
        }
    },
    created()
    {
        this.getData();
        this.startAutoUpdate();
    },
    methods: {
        getData()
        {
            fetch('/get-status')
                .then(response => response.json())
                .then(data =>
                {
                    this.unpack(data);
                });
            console.log('Data loaded');
        },
        unpack(data)
        {
            this.nodes = [];
            for (let name of this.nodeNames)
            {
                let node = data.Nodes.find(node => node.hostname.toLowerCase() === name);
                if (node.status)
                {
                    this.nodes.push({
                        ...node,
                        ips: node.ips.map(ip => `${ip[1]}(${ip[0]})&nbsp;&nbsp;&nbsp;&nbsp;`).join(''),
                        gpus: node.gpus.map(gpu => ({
                            ...gpu,
                            memory: `${gpu.use_mem}/${gpu.tot_mem}`,
                            memoryPercentage: gpu.use_mem / gpu.tot_mem * 100,
                            users: this.assembleUsers(gpu.users),
                            calendar: gpu.calendar.map(booking =>
                            {
                                return booking.map(user =>
                                {
                                    return {
                                        name: user[0],
                                        user: user[1],
                                        illegal: this.illegalStatus(user[2])
                                    };
                                })
                            })
                        }))
                    });
                }
                else
                {
                    this.nodes.push({
                        ...node,
                        version: 'Offline',
                        gpus: node.gpus.map(gpu => ({
                            ...gpu,
                            calendar: gpu.calendar.map(booking =>
                            {
                                return booking.map(user =>
                                {
                                    let illegalStatus = '';
                                    switch (user[2])
                                    {
                                        case 1:
                                            illegalStatus = 'illegal_booking';
                                            break;
                                        case 2:
                                            illegalStatus = 'illegal_maxgpu';
                                            break;
                                        case 3:
                                            illegalStatus = 'illegal_maxday';
                                            break;
                                        default:
                                            illegalStatus = '';
                                    }
                                    return {
                                        name: user[0],
                                        user: user[1],
                                        illegal: illegalStatus
                                    };
                                })
                            })
                        }))
                    })
                }
            }
            this.dateList = data.date_list;
            this.shortDateList = data.date_list.map(date =>
            {
                let dateArray = date.split(' ');
                return `${dateArray[1]}/${dateArray[2]}`;
            });
            this.illegalUsers = data.illegal_users;
            this.teamupIds = data.teamup_ids;
        },
        assembleUsers(users)
        {
            let user_dict = {};
            for (let user of users)
            {
                if (user_dict[user.username])
                {
                    user_dict[user.username].memory += user['mem(MiB)'];
                    user_dict[user.username].commands.push(user.command);
                    user_dict[user.username].illegal = user_dict[user.username].illegal || user.user_code !== 0;
                }
                else
                {
                    user_dict[user.username] = {
                        name: user.username,
                        illegal: user.user_code !== 0,
                        memory: user['mem(MiB)'],
                        commands: [user.command],
                    };
                }
            }
            return Object.values(user_dict);
        },
        illegalStatus(code)
        {
            switch (code)
            {
                case 0:
                    return '';
                case 1:
                    return 'illegal_booking';
                case 2:
                    return 'illegal_maxgpu';
                case 3:
                    return 'illegal_maxday';
                default:
                    return 'illegal_unknown';
            }
        },
        startAutoUpdate()
        {
            if (!this.intervalId)
            {
                this.intervalId = setInterval(this.getData, 3000);
            }
        },
        stopAutoUpdate()
        {
            if (this.intervalId)
            {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },
        setAutoRefresh()
        {
            if (!this.intervalId)
            {
                console.log('Start auto update');
                this.startAutoUpdate();
            }
            else
            {
                console.log('Stop auto update');
                this.stopAutoUpdate();
            }
        },
        async book(nodeIndex, gpuIndex, dateIndex)
        {
            let username = prompt("请输入服务器账号：");
            if (username === null)
            {
                return;
            }
            let users = prompt("请输入使用者（置空则默认与服务器账号一致，多位则用英文逗号分隔）：");
            if (users === null)
            {
                return;
            }
            const api_key = "1977bb106b6ebfecd83550d34fee6cc568d08b98208d672a755204e12a3d1cb0"
            const url = `https://api.teamup.com/${this.teamupIds[nodeIndex]}/events`;
            const payload = {
                'subcalendar_id': this.subcalendarIds[this.teamupIds[nodeIndex]][gpuIndex],
                "subcalendarIds": [
                    this.subcalendarIds[this.teamupIds[nodeIndex]][gpuIndex]
                ],
                "start_dt": `${this.dateList[dateIndex].replaceAll(' ', '-')}T00:00:00Z`,
                "end_dt": `${this.dateList[dateIndex].replaceAll(' ', '-')}T23:59:59Z`,
                "all_day": true,
                "title": username,
                "who": users,
                "signup_enabled": true,
                "comments_enabled": true,
            };
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'Teamup-Token': api_key,
                },
                body: JSON.stringify(payload),
            };

            fetch(url, options)
                .then(response =>
                {
                    if (response.status === 201)
                    {
                        alert('Booking success');
                    }
                    else
                    {
                        alert('Booking failed');
                    }
                    return response.json();
                })
                .then(data => console.log(data));
        }
    }
}

!function main()
{
    const app = Vue.createApp(appConfig);
    const virtualMachine = app.mount("#app")
}();
