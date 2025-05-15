#!/bin/bash

# 设置 conda 路径
CONDA_PATH="/data/huxy/anaconda3"  # 根据你的 conda 安装路径进行调整

# 初始化 conda
source "$CONDA_PATH/etc/profile.d/conda.sh"

# 激活 base 环境
conda activate base

# 记录脚本执行时间
echo "Script executed at: $(date)" >> /home/huxy/GPU-Calendar-Book-Monitor-LDS-New-UI/reboot_execution.log

# 切换到脚本所在目录
cd /home/huxy/GPU-Calendar-Book-Monitor-LDS-New-UI/GPU-Calendar-Monitor-main

# 运行 Python 脚本
nohup python -m next_cluster.client.cli_flask > /home/huxy/GPU-Calendar-Book-Monitor-LDS-New-UI/booksys_client_record.log 2>&1 &
