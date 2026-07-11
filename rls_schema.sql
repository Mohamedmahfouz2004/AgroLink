-- تفعيل نظام حماية الصفوف (RLS) لكل الجداول
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Farm" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TruckType" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpenseCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TruckRegistration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyClosure" ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات تسمح للتطبيق بقراءة وكتابة البيانات (لأن تسجيل الدخول بيتم من داخل التطبيق نفسه)
CREATE POLICY "Allow public access" ON "User" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "Farm" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "TruckType" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "ExpenseCategory" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "TruckRegistration" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "Expense" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "Transaction" FOR ALL USING (true);
CREATE POLICY "Allow public access" ON "DailyClosure" FOR ALL USING (true);
