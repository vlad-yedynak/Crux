namespace Crux.Models.Entities;

public class UserLessonAccess
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LessonId { get; set; }
    
    public required User User { get; set; }
    public required Lesson Lesson { get; set; }
    
    public DateTime GrantedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
}