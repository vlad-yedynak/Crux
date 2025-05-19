using Crux.Models.EntityTypes;

namespace Crux.Models.Entities;

public class User
{
    public int Id { get; set; }
    
    public required string FirstName { get; set; }
    
    public required string LastName { get; set; }
    
    public required string Email { get; set; }
    
    public required string Password { get; set; }
    
    public required UserRole Role { get; set; }
    
    public ICollection<UserTaskProgress> CompletedTasks { get; set; } = new List<UserTaskProgress>();
    
    public ICollection<UserQuestionProgress> CompletedQuestions { get; set; } = new List<UserQuestionProgress>();
    
    public ICollection<UserLessonProgress> ScorePoints { get; set; } = new List<UserLessonProgress>();
}
