# Generated manually for template_type migration step 3

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('supplies', '0007_migrate_template_type_data'),
    ]

    operations = [
        # 删除旧的template_type字段
        migrations.RemoveField(
            model_name='applicationtemplate',
            name='template_type',
        ),
        # 重命名新字段为template_type
        migrations.RenameField(
            model_name='applicationtemplate',
            old_name='template_type_new',
            new_name='template_type',
        ),
    ] 