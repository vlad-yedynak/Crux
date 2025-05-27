namespace Crux.Models.Entities;

public class UserTaskProgress
{
    public User User { get; set; }
    
    public int UserId { get; set; }
    
    public Task Task { get; set; }
    
    public int TaskId { get; set; }
}
