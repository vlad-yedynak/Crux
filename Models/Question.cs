using System.ComponentModel.DataAnnotations;
using Crux.Models.Cards;

namespace Crux.Models;

public class Question
{
    public int Id { get; set; }
    
    public int TestCardId { get; set; }
    
    public TestCard? TestCard { get; set; }
    
    [MaxLength(255)]
    public required string QuestionText { get; set; }
    
    public ICollection<Answer> Answers { get; set; } = new List<Answer>();
}
