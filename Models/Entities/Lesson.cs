using Crux.Models.EntityTypes;

namespace Crux.Models.Entities;

public class Lesson
{
    public int Id { get; set; }
    
    public required string Title { get; set; }
    
    public LessonVisibility Visibility { get; set; } = LessonVisibility.Private;
    
    public ICollection<Card> Cards { get; set; } = new List<Card>();
    
    public ICollection<UserLessonProgress> UserScorePoints { get; set; } = new List<UserLessonProgress>();
    
    public ICollection<LessonTracker> LessonTrackers { get; set; } = new List<LessonTracker>();
    
    public ICollection<UserLessonAccess> UserLessonAccesses { get; set; } = new List<UserLessonAccess>();
}
