# Generated manually for template_type migration step 2

from django.db import migrations


def convert_template_types_to_array(apps, schema_editor):
    """将现有的字符串类型的template_type转换为数组格式"""
    ApplicationTemplate = apps.get_model('supplies', 'ApplicationTemplate')
    
    for template in ApplicationTemplate.objects.all():
        # 将旧的字符串类型转换为数组并保存到新字段
        if template.template_type:
            template.template_type_new = [template.template_type]
        else:
            template.template_type_new = []
        template.save()


def reverse_template_types_to_string(apps, schema_editor):
    """回滚：将数组格式的template_type转换回字符串格式"""
    ApplicationTemplate = apps.get_model('supplies', 'ApplicationTemplate')
    
    for template in ApplicationTemplate.objects.all():
        # 取新字段数组的第一个元素作为旧字段的值
        if template.template_type_new and len(template.template_type_new) > 0:
            template.template_type = template.template_type_new[0]
        else:
            template.template_type = 'supply_management'  # 默认值
        template.save()


class Migration(migrations.Migration):

    dependencies = [
        ('supplies', '0006_add_template_type_array'),
    ]

    operations = [
        # 进行数据迁移
        migrations.RunPython(
            convert_template_types_to_array,
            reverse_template_types_to_string,
        ),
    ] 