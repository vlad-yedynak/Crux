using Crux.Models.EntityTypes;

namespace Crux.Models.Entities;

public abstract class Card
{
    public int Id { get; set; }
    
    public required string Title { get; set; }
    
    public required string Description { get; set; }
    
    public required int LessonId { get; set; }
    
    public Lesson? Lesson { get; set; }
    
    public CardType CardType { get; set; }
}
