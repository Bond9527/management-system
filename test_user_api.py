#!/usr/bin/env python3
"""
用户管理API测试脚本
测试新的用户管理功能和修复的序列化问题
"""

import requests
import json

import sys

# API基础URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_user_api():
    """测试用户管理API"""
    print("🧪 测试用户管理API...")
    
    # 测试数据
    test_user = {
        "username": "test_user_api",
        "email": "testapi@example.com",
        "password": "testpass123",
        "confirm_password": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "employee_id": "EMP001",
        "phone": "13800138000",
        "is_active": True,
        "is_staff": False,
        "is_superuser": False
    }
    
    # 首先用管理员登录
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    print("1️⃣ 用管理员登录...")
    login_response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        access_token = token_data.get("access")
        headers = {"Authorization": f"Bearer {access_token}"}
        print("✅ 登录成功")
    else:
        print(f"❌ 登录失败: {login_response.status_code}")
        print(login_response.text)
        return
    
    # 测试获取用户列表
    print("\n2️⃣ 获取用户列表...")
    users_response = requests.get(f"{BASE_URL}/users/", headers=headers)
    
    if users_response.status_code == 200:
        users_data = users_response.json()
        print(f"✅ 获取用户列表成功，共 {users_data.get('count', 0)} 个用户")
        
        # 显示前3个用户
        results = users_data.get('results', [])
        for i, user in enumerate(results[:3]):
            print(f"   用户 {i+1}: {user.get('username')} - {user.get('email')}")
    else:
        print(f"❌ 获取用户列表失败: {users_response.status_code}")
        print(users_response.text)
    
    # 测试获取部门列表
    print("\n3️⃣ 获取部门列表...")
    departments_response = requests.get(f"{BASE_URL}/departments/", headers=headers)
    
    if departments_response.status_code == 200:
        departments_data = departments_response.json()
        if isinstance(departments_data, list):
            print(f"✅ 获取部门列表成功，共 {len(departments_data)} 个部门")
        else:
            print(f"✅ 获取部门列表成功，共 {departments_data.get('count', 0)} 个部门")
    else:
        print(f"❌ 获取部门列表失败: {departments_response.status_code}")
        print(departments_response.text)
    
    # 测试获取职称列表
    print("\n4️⃣ 获取职称列表...")
    job_titles_response = requests.get(f"{BASE_URL}/job-titles/", headers=headers)
    
    if job_titles_response.status_code == 200:
        job_titles_data = job_titles_response.json()
        if isinstance(job_titles_data, list):
            print(f"✅ 获取职称列表成功，共 {len(job_titles_data)} 个职称")
        else:
            print(f"✅ 获取职称列表成功，共 {job_titles_data.get('count', 0)} 个职称")
    else:
        print(f"❌ 获取职称列表失败: {job_titles_response.status_code}")
        print(job_titles_response.text)
    
    # 测试获取角色列表
    print("\n5️⃣ 获取角色列表...")
    roles_response = requests.get(f"{BASE_URL}/roles/", headers=headers)
    
    if roles_response.status_code == 200:
        roles_data = roles_response.json()
        if isinstance(roles_data, list):
            print(f"✅ 获取角色列表成功，共 {len(roles_data)} 个角色")
        else:
            print(f"✅ 获取角色列表成功，共 {roles_data.get('count', 0)} 个角色")
    else:
        print(f"❌ 获取角色列表失败: {roles_response.status_code}")
        print(roles_response.text)
    
    # 测试创建用户
    print("\n6️⃣ 创建测试用户...")
    create_response = requests.post(f"{BASE_URL}/users/", json=test_user, headers=headers)
    
    if create_response.status_code == 201:
        created_user = create_response.json()
        user_id = created_user.get('id')
        print(f"✅ 创建用户成功，用户ID: {user_id}")
        
        # 测试更新用户
        print("\n7️⃣ 更新测试用户...")
        update_data = {
            "first_name": "Updated",
            "last_name": "Name",
            "phone": "13900139000"
        }
        
        update_response = requests.put(f"{BASE_URL}/users/{user_id}/", json=update_data, headers=headers)
        
        if update_response.status_code == 200:
            print("✅ 更新用户成功")
        else:
            print(f"❌ 更新用户失败: {update_response.status_code}")
            print(update_response.text)
        
        # 测试重置密码
        print("\n8️⃣ 重置用户密码...")
        password_data = {
            "password": "newpass123",
            "confirm_password": "newpass123"
        }
        
        password_response = requests.post(f"{BASE_URL}/users/{user_id}/reset_password/", json=password_data, headers=headers)
        
        if password_response.status_code == 200:
            print("✅ 重置密码成功")
        else:
            print(f"❌ 重置密码失败: {password_response.status_code}")
            print(password_response.text)
        
        # 测试切换用户状态
        print("\n9️⃣ 切换用户状态...")
        toggle_response = requests.post(f"{BASE_URL}/users/{user_id}/toggle_status/", headers=headers)
        
        if toggle_response.status_code == 200:
            toggle_data = toggle_response.json()
            print(f"✅ 切换用户状态成功，当前状态: {'激活' if toggle_data.get('is_active') else '禁用'}")
        else:
            print(f"❌ 切换用户状态失败: {toggle_response.status_code}")
            print(toggle_response.text)
        
        # 测试删除用户
        print("\n🔟 删除测试用户...")
        delete_response = requests.delete(f"{BASE_URL}/users/{user_id}/", headers=headers)
        
        if delete_response.status_code == 204:
            print("✅ 删除用户成功")
        else:
            print(f"❌ 删除用户失败: {delete_response.status_code}")
            print(delete_response.text)
    
    else:
        print(f"❌ 创建用户失败: {create_response.status_code}")
        print(create_response.text)
    
    print("\n🎉 用户管理API测试完成!")

if __name__ == "__main__":
    try:
        test_user_api()
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务器，请确保Django服务器正在运行在 http://127.0.0.1:8000")
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        sys.exit(1) 