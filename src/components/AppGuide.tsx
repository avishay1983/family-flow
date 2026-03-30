import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  LayoutGrid,
  ListChecks,
  Archive,
  Users,
  FolderPlus,
  Link2,
  Settings,
  CheckCircle2,
  CalendarDays,
  ArrowRightLeft,
  GripVertical,
  Moon,
  Sun,
  BellRing,
  Trash2,
  Pencil,
  Search,
  Plus,
  BookOpen,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AppGuide({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-hidden p-0" dir="rtl">
        <div className="flex h-full max-h-[90dvh] flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              מדריך שימוש באפליקציה
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <Accordion type="multiple" className="space-y-1">

              {/* Workspaces */}
              <AccordionItem value="workspaces" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    מרחבי עבודה
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>מרחב עבודה הוא קטגוריה שאליה משייכים משימות. לדוגמה: "עבודה", "משפחה", "אישי".</p>
                  <p><strong>יצירת מרחב חדש:</strong> לחץ על כפתור <Plus className="h-3 w-3 inline" /> בראש רשימת המרחבים בתפריט הצד.</p>
                  <p><strong>מחיקת מרחב:</strong> העבר את העכבר מעל מרחב בתפריט ולחץ על <Trash2 className="h-3 w-3 inline" />.</p>
                  <p><strong>מחיקת כל המשימות:</strong> בתוך מרחב, כפתור "מחק הכל" מופיע בראש העמוד כדי למחוק את כל המשימות במרחב.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Groups */}
              <AccordionItem value="groups" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <FolderPlus className="h-4 w-4 text-primary" />
                    קבוצות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>קבוצות מאגדות מספר מרחבי עבודה תחת כותרת אחת. לדוגמה: קבוצת "משפחת כהן" עם מרחבים "בית", "ילדים", "קניות".</p>
                  <p><strong>יצירת קבוצה:</strong> לחץ על "קבוצה חדשה" בתחתית התפריט.</p>
                  <p><strong>עריכת קבוצה:</strong> העבר עכבר מעל שם הקבוצה ולחץ על <Settings className="h-3 w-3 inline" />.</p>
                  <p>חברי קבוצה מקבלים גישה אוטומטית לכל מרחבי העבודה בקבוצה.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Tasks */}
              <AccordionItem value="tasks" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    ניהול משימות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p><strong>יצירת משימה:</strong> לחץ על כפתור <Plus className="h-3 w-3 inline" /> בתחתית המסך. בחר שם, תיאור, עדיפות, תאריך יעד ושעה.</p>
                  <p><strong>עדיפויות:</strong> גבוה (אדום), בינוני (כתום), נמוך (ירוק).</p>
                  <p><strong>שיוך חברים:</strong> ניתן לשייך משימה לחבר/חברים ספציפיים במרחב העבודה.</p>
                  <p><strong>תגיות:</strong> הוסף תגיות למשימה לסיווג ומעקב.</p>
                  <p><strong>יום חוזר:</strong> הגדר יום בשבוע שבו המשימה חוזרת באופן קבוע.</p>
                  <p><strong>עריכה:</strong> לחץ על <Pencil className="h-3 w-3 inline" /> ליד המשימה.</p>
                  <p><strong>מחיקה:</strong> לחץ על <Trash2 className="h-3 w-3 inline" /> או החלק שמאלה (במובייל).</p>
                  <p><strong>שינוי סדר:</strong> גרור באמצעות <GripVertical className="h-3 w-3 inline" /> כדי לשנות את סדר המשימות.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Task Completion */}
              <AccordionItem value="completion" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    סימון משימה כבוצעה
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>כאשר מסמנים משימה, נפתח דיאלוג עם שלוש אפשרויות:</p>
                  <p><CheckCircle2 className="h-3 w-3 inline text-success" /> <strong>סמן כבוצע:</strong> המשימה עוברת לסקשן "הושלמו" בתחתית.</p>
                  <p><Archive className="h-3 w-3 inline text-primary" /> <strong>העבר למחסן:</strong> המשימה עוברת למחסן המשימות תחת המרחב שממנו היא הגיעה (לא זמין אם המשימה כבר במחסן).</p>
                  <p><CalendarDays className="h-3 w-3 inline text-warning" /> <strong>תזמן לתאריך עתידי:</strong> קבע תאריך חדש למשימה — מחר, שבוע, חודש, או תאריך מותאם.</p>
                  <p><ArrowRightLeft className="h-3 w-3 inline" /> <strong>העבר למרחב אחר:</strong> אם המשימה במחסן, ניתן להעביר אותה למרחב עבודה ספציפי.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Bulk Actions */}
              <AccordionItem value="bulk" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚡</span>
                    פעולות גורפות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>כפתור ⚡ מופיע ליד כותרת "הושלמו" כאשר יש משימות שבוצעו. הוא מאפשר:</p>
                  <p><strong>העבר הכל למחסן:</strong> כל המשימות שהושלמו עוברות למחסן תוך שמירה על מרחב העבודה המקורי.</p>
                  <p><strong>תזמן מחדש:</strong> קבע תאריך חדש לכל המשימות שהושלמו בלחיצה אחת.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Backlog */}
              <AccordionItem value="backlog" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-primary" />
                    מחסן משימות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>מחסן המשימות הוא מקום לאחסון משימות לתכנון עתידי.</p>
                  <p><strong>קיבוץ:</strong> המשימות מקובצות לפי מרחבי העבודה שמהם הן הגיעו. לחץ על קבוצה כדי לפתוח/לסגור אותה.</p>
                  <p><strong>סימון במחסן:</strong> כאשר מסמנים משימה במחסן, ניתן לסמן כבוצע, לתזמן מחדש, או להעביר למרחב עבודה.</p>
                  <p><strong>העברה למרחב:</strong> לחץ על <ArrowRightLeft className="h-3 w-3 inline" /> כדי להעביר משימה ממחסן למרחב עבודה פעיל.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Views */}
              <AccordionItem value="views" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                    תצוגות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>ניתן לעבור בין שני מצבי תצוגה באמצעות הכפתורים בכותרת:</p>
                  <p><ListChecks className="h-3 w-3 inline" /> <strong>תצוגת רשימה:</strong> משימות מחולקות לקטגוריות זמן — באיחור, השבוע, שבועות הבאים. כולל גרירה לשינוי סדר ותאריך.</p>
                  <p><LayoutGrid className="h-3 w-3 inline" /> <strong>תצוגת קנבן:</strong> לוח עמודות — לביצוע, בתהליך, בוצע. גרור כרטיסים בין עמודות (בדסקטופ) או השתמש בכפתורי ניווט (במובייל).</p>
                </AccordionContent>
              </AccordionItem>

              {/* Members & Invites */}
              <AccordionItem value="members" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    חברים והזמנות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p><strong>ניהול חברים:</strong> לחץ על <Users className="h-3 w-3 inline" /> ליד מרחב עבודה בתפריט כדי לנהל את חברי המרחב.</p>
                  <p><strong>הזמנה בלינק:</strong> לחץ על <Link2 className="h-3 w-3 inline" /> כדי ליצור קישור הזמנה. שתף עם מי שתרצה לצרף למרחב.</p>
                  <p>חברי מרחב רואים את כל המשימות של אותו מרחב ויכולים לערוך ולנהל אותן.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Search */}
              <AccordionItem value="search" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-primary" />
                    חיפוש
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>שדה החיפוש בכותרת מאפשר לחפש משימות לפי שם, תיאור או תגית בתוך המרחב הנוכחי.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Notifications */}
              <AccordionItem value="notifications" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    התראות Push
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>האפליקציה תומכת בהתראות Push כדי להזכיר לך על משימות.</p>
                  <p><strong>הפעלה:</strong> סטטוס ההתראות מוצג בתחתית התפריט הצדדי. לחץ עליו כדי להפעיל.</p>
                  <p><strong>חסימה:</strong> אם ההתראות חסומות, יש לשנות את ההגדרות בדפדפן.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Settings */}
              <AccordionItem value="settings" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    הגדרות
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>גישה להגדרות דרך כפתור <Settings className="h-3 w-3 inline" /> בתחתית התפריט הצדדי.</p>
                  <p><strong>מרחב ברירת מחדל:</strong> בחר מרחב שייפתח אוטומטית בכניסה, או הצג דיאלוג בחירה.</p>
                  <p><strong>תצוגה ברירת מחדל:</strong> בחר בין רשימה לקנבן כתצוגת ברירת מחדל.</p>
                  <p><strong>סדר מרחבים:</strong> גרור כדי לשנות את סדר המרחבים בדיאלוג הבחירה. סמן אילו יוצגו.</p>
                  <p><strong>ערכת נושא:</strong> עבור בין מצב בהיר <Sun className="h-3 w-3 inline" /> לכהה <Moon className="h-3 w-3 inline" />.</p>
                  <p><strong>סיור הדרכה:</strong> ניתן להפעיל מחדש את סיור ההדרכה מההגדרות.</p>
                </AccordionContent>
              </AccordionItem>

              {/* Realtime */}
              <AccordionItem value="realtime" className="border rounded-xl px-3">
                <AccordionTrigger className="text-sm font-bold hover:no-underline gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔄</span>
                    סנכרון בזמן אמת
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-2 pr-6">
                  <p>כל שינוי במשימות מסונכרן אוטומטית בין כל המכשירים והמשתמשים.</p>
                  <p>אם מישהו מעדכן משימה, השינוי מופיע אצלך מיד ללא צורך בריענון.</p>
                  <p>ניתן גם לרענן ידנית על ידי משיכה כלפי מטה (Pull to Refresh) במובייל.</p>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </ScrollArea>

          <div className="border-t border-border bg-background px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              variant="default"
              className="h-11 w-full rounded-2xl font-bold"
              onClick={onClose}
            >
              סגור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
