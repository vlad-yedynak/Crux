using Crux.Models.Cards;

namespace Crux.Models.Entities;

public class Task
{
    public int Id { get; set; }
    
    public required string Name { get; set; }
    
    public required string Description { get; set; }
    
    public int Points { get; set; }
    
    public ICollection<TaskData> ExpectedData { get; set; } = new List<TaskData>();
    
    public int SandboxCardId { get; set; }
    
    public SandboxCard? SandboxCard { get; set; }
    
    public ICollection<UserTaskProgress> UserCompletedTasks { get; set; } = new List<UserTaskProgress>();
}
