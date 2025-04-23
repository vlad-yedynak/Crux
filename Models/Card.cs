namespace Crux.Models;

public abstract class Card
{
    public int Id { get; set; }
    
    public required string Title { get; set; }
    
    public required string Description { get; set; }
    
    public int LessonId { get; set; }
    
    public Lesson? Lesson { get; set; }
}
