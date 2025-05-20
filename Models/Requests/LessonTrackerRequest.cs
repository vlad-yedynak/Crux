namespace Crux.Models.Requests;

public class LessonTrackerRequest
{
    public required int UserId { get; set; }
    
    public required int LessonId { get; set; }
    
    public required double TrackedTime { get; set; }
}
