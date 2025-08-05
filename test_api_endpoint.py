#!/usr/bin/env python3
"""
测试API端点的脚本
"""
import os
import django
import requests
import json

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from supplies.models import DynamicCalculationItem, ApplicationForm

def test_api_endpoint():
    # 获取第一个用户
    user = User.objects.first()
    if not user:
        print("没有找到用户")
        return
    
    print(f"使用用户: {user.username}")
    
    # 创建JWT令牌
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"访问令牌: {access_token[:20]}...")
    
    # 测试API端点
    url = "http://localhost:8000/api/dynamic-calculation-items/by_form/"
    params = {
        'form_id': 17,
        'include_hidden': 'false'
    }
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # 禁用代理
        proxies = {
            'http': None,
            'https': None
        }
        response = requests.get(url, params=params, headers=headers, proxies=proxies)
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"成功获取数据，项目数量: {len(data)}")
            if data:
                print(f"第一个项目: {data[0]}")
        else:
            print(f"错误响应: {response.text}")
            
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    test_api_endpoint() 