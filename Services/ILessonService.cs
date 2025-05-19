using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonService
{
    ICollection<LessonResponse> GetLessons(HttpContext context);
    
    FullCardResponse GetCardFull(HttpContext context, int id);
    
    BriefCardResponse GetCardBrief(HttpContext context, int id);
    
    EducationalDataResponse AddEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    
    LessonResponse AddLesson(HttpContext context, string title);
    
    FullCardResponse AddCard(HttpContext context, CardRequest cardRequest);
    
    QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest);
    
    TaskResponse AddTask(HttpContext context, TaskRequest taskRequest);
}
