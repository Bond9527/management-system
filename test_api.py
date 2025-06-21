#!/usr/bin/env python3
import requests
import json

BASE_URL = 'http://localhost:8000/api'

def test_api():
    print("测试API连接...")
    
    # 测试部门API
    try:
        response = requests.get(f'{BASE_URL}/departments/')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 部门API正常，返回 {len(data.get('results', data))} 个部门")
        else:
            print(f"❌ 部门API错误: {response.status_code}")
    except Exception as e:
        print(f"❌ 部门API连接失败: {e}")
    
    # 测试职位API
    try:
        response = requests.get(f'{BASE_URL}/positions/')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 职位API正常，返回 {len(data.get('results', data))} 个职位")
        else:
            print(f"❌ 职位API错误: {response.status_code}")
    except Exception as e:
        print(f"❌ 职位API连接失败: {e}")
    
    # 测试职称API
    try:
        response = requests.get(f'{BASE_URL}/job-titles/')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 职称API正常，返回 {len(data.get('results', data))} 个职称")
        else:
            print(f"❌ 职称API错误: {response.status_code}")
    except Exception as e:
        print(f"❌ 职称API连接失败: {e}")
    
    # 测试菜单API
    try:
        response = requests.get(f'{BASE_URL}/menus/')
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 菜单API正常，返回 {len(data.get('results', data))} 个菜单")
        else:
            print(f"❌ 菜单API错误: {response.status_code}")
    except Exception as e:
        print(f"❌ 菜单API连接失败: {e}")

if __name__ == '__main__':
    test_api() 