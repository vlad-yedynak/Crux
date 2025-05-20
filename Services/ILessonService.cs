using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonService
{
    ICollection<LessonResponse> GetLessons(HttpContext context);
    
    FullCardResponse GetCardFull(HttpContext context, int id);
    
    BriefCardResponse GetCardBrief(HttpContext context, int id);
    
    EducationalDataResponse AddEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    
    EducationalDataResponse UpdateEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    
    LessonResponse AddLesson(HttpContext context, string title);

    public LessonResponse UpdateLessonName(HttpContext context, UpdateLessonRequest request);
    
    public bool DeleteLesson(HttpContext context, int id);
    
    FullCardResponse AddCard(HttpContext context, CardRequest cardRequest);

    public FullCardResponse UpdateCard(HttpContext context, CardRequest cardRequest);
    
    public bool DeleteCard(HttpContext context, int id);
    
    QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest);

    public QuestionResponse UpdateQuestion(HttpContext context, QuestionRequest questionRequest);

    public bool DeleteQuestion(HttpContext context, int id);
    
    TaskResponse AddTask(HttpContext context, TaskRequest taskRequest);

    public TaskResponse UpdateTask(HttpContext context, TaskRequest taskRequest);
    
    public bool DeleteTask(HttpContext context, int id);
}
