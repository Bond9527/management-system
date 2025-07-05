# Generated manually for template_type migration step 1

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('supplies', '0005_applicationform_dynamicforecastdata_and_more'),
    ]

    operations = [
        # 添加新的JSONField字段
        migrations.AddField(
            model_name='applicationtemplate',
            name='template_type_new',
            field=models.JSONField(default=list, verbose_name='模板类型(新)'),
        ),
    ] 