namespace Crux.Models;

public class Lesson
{
    public int Id { get; set; }
    
    public required string Title { get; set; }
    
    public required ICollection<Card> Cards { get; set; }
}
