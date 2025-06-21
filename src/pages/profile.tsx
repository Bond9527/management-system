import React, { useEffect, useState } from 'react';
import { Input, Button, Card, CardBody, Avatar, Spinner } from "@heroui/react";
import { getUserInfo, apiRequest } from '@/services/api';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  department?: string;
  position?: string;
  phone?: string;
  avatar_url?: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<ProfileData>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserInfo()
      .then((data) => {
        setProfile(data);
        setForm(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiRequest<ProfileData>(`/user/`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setProfile(updated);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /> 加载中...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!profile) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardBody className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar src={profile.avatar_url} name={profile.username} size="lg" />
            <h2 className="text-2xl font-bold">个人资料</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="用户名"
              name="username"
              value={form.username || ''}
              onChange={handleChange}
              disabled
            />
            <Input
              label="邮箱"
              name="email"
              value={form.email || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="部门"
              name="department"
              value={form.department || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="职位"
              name="position"
              value={form.position || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
            <Input
              label="电话"
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              disabled={!editMode}
            />
          </div>
          <div className="flex gap-4 justify-end">
            {editMode ? (
              <>
                <Button color="primary" onClick={handleSave} isLoading={saving}>保存</Button>
                <Button variant="flat" onClick={() => { setEditMode(false); setForm(profile); }}>取消</Button>
              </>
            ) : (
              <Button color="primary" onClick={() => setEditMode(true)}>编辑资料</Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ProfilePage; 