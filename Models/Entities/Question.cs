using Crux.Models.Cards;

namespace Crux.Models.Entities;

public class Question
{
    public int Id { get; set; }
    
    public int TestCardId { get; set; }
    
    public TestCard? TestCard { get; set; }
    
    public required string QuestionText { get; set; }
    
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
