namespace Crux.Models.Entities;

public class UserQuestionProgress
{
    public User User { get; set; }
    
    public int UserId { get; set; }
    
    public Question Question { get; set; }
    
    public int QuestionId { get; set; }
}
