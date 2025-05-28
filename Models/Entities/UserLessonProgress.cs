namespace Crux.Models.Entities;

public class UserLessonProgress
{
    public int UserId { get; set; }
    
    public User User { get; set; }

    public int LessonId { get; set; }
    
    public Lesson Lesson { get; set; }

    public int ScorePoint { get; set; }
}
