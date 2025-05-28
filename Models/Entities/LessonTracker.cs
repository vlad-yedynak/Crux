namespace Crux.Models.Entities;

public class LessonTracker
{
    public int UserId { get; set; }
    
    public User User { get; set; }
    
    public int LessonId { get; set; }
    
    public Lesson Lesson { get; set; }
    
    public double TrackedTime { get; set; }
}
