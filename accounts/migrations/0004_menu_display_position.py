# Generated by Django 5.2.3 on 2025-06-21 01:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_auto_20250621_0056'),
    ]

    operations = [
        migrations.AddField(
            model_name='menu',
            name='display_position',
            field=models.CharField(choices=[('sidebar', '侧边栏'), ('navbar', '导航栏'), ('both', '侧边栏和导航栏')], default='sidebar', max_length=20, verbose_name='显示位置'),
        ),
    ]
