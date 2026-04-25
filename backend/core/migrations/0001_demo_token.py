from django.conf import settings
from django.db import migrations


DEMO_TOKEN_KEY = "1aa655afe79c414476a07608680446bec24976ad"
DEMO_USERNAME = "demo"


def create_demo_user_and_token(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Token = apps.get_model("authtoken", "Token")

    user, _ = User.objects.get_or_create(
        username=DEMO_USERNAME,
        defaults={"email": "", "is_active": True},
    )
    user.password = "!"
    user.save(update_fields=["password"])

    Token.objects.update_or_create(
        user=user,
        defaults={"key": DEMO_TOKEN_KEY},
    )


def remove_demo_user_and_token(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Token = apps.get_model("authtoken", "Token")

    Token.objects.filter(key=DEMO_TOKEN_KEY).delete()
    User.objects.filter(username=DEMO_USERNAME).delete()


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("authtoken", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_demo_user_and_token, remove_demo_user_and_token),
    ]