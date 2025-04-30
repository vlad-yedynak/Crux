using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonService
{
    ICollection<LessonResponse> GetLessons(HttpContext context);
    
    FullCardResponse GetCard(HttpContext context, int id);
    
    ICollection<FullCardResponse> GetLessonCardsFull(HttpContext context, int lessonId);
    
    ICollection<BriefCardResponse> GetLessonCardsBrief(HttpContext context, int lessonId);
    
    LessonResponse AddLesson(HttpContext context, string title);
    
    FullCardResponse AddCard(HttpContext context, CardRequest cardRequest);
    
    QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest);
    
    TaskResponse AddTask(HttpContext context, TaskRequest taskRequest);
}
