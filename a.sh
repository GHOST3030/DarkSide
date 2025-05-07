#!/bin/bash

# اسم الفرع الذي تريد العمل عليه (مثلاً main أو master)
BRANCH="main"

# رسالة الالتزام
COMMIT_MSG="تحديث جديد على الأداة"

# تأكد من أنك في مجلد الأداة الصحيح
#cd /المسار/إلى/مجلد/الأداة || exit

# تحديث الملفات من العمل الحالي
git add .

# إنشاء الالتزام
git commit -m "$COMMIT_MSG"

# رفع التحديث إلى GitHub
git push origin $BRANCH

echo "تم رفع التحديث إلى GitHub بنجاح."
