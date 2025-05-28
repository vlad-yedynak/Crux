namespace Crux.Models.Entities;

public class Answer
{
    public int Id { get; set; }
    
    public bool IsCorrect { get; set; }
    
    public required string AnswerText { get; set; }
    
    public required int Score { get; set; }
    
    public required int QuestionId { get; set; }
    
    public Question? Question { get; set; }
}
