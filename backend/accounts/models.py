from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import random,string
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    github_username = models.CharField(max_length=255, blank=True)
    github_id = models.CharField(max_length=255, blank=True, unique=True, null=True)
    avatar_url = models.URLField(max_length=512, blank=True)
    style_profile = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
    else:
        if hasattr(instance, 'profile'):
            instance.profile.save()
        else:
            UserProfile.objects.create(user=instance)


class EmailVerificationCode(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name='verification_codes')
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self,*args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=15)
        super().save(*args,**kwargs)


    @staticmethod
    def generate_code():
        return ''.join(random.choices(string.digits,k=6))

    def is_expired(self):
        return timezone.now()>self.expires_at
    
    def __str__(self):
        return f"Code {self.code} for {self.email}"
    
    class Meta:
        db_table = 'email_verification_codes'
        ordering = ['-created_at']
