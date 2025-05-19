namespace Crux.Models.Entities;

public class Lesson
{
    public int Id { get; set; }
    
    public required string Title { get; set; }
    
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    
    public ICollection<UserLessonProgress> UserScorePoints { get; set; } = new List<UserLessonProgress>();
}
