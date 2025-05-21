using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ILessonService
{
    ICollection<LessonResponse> GetLessons(HttpContext context);
    Task<ICollection<LessonResponse>> GetLessonsAsync(HttpContext context);
    
    FullCardResponse GetCardFull(HttpContext context, int id);
    Task<FullCardResponse> GetCardFullAsync(HttpContext context, int id);
    
    BriefCardResponse GetCardBrief(HttpContext context, int id);
    Task<BriefCardResponse> GetCardBriefAsync(HttpContext context, int id);
    
    EducationalDataResponse AddEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    Task<EducationalDataResponse> AddEducationalDataAsync(HttpContext context, EducationalCardDataRequest dataRequest);
    
    EducationalDataResponse UpdateEducationalData(HttpContext context, EducationalCardDataRequest dataRequest);
    Task<EducationalDataResponse> UpdateEducationalDataAsync(HttpContext context, EducationalCardDataRequest dataRequest);
    
    LessonResponse AddLesson(HttpContext context, string title);
    Task<LessonResponse> AddLessonAsync(HttpContext context, string title);

    LessonResponse UpdateLessonName(HttpContext context, UpdateLessonRequest request);
    Task<LessonResponse> UpdateLessonNameAsync(HttpContext context, UpdateLessonRequest request);
    
    bool DeleteLesson(HttpContext context, int id);
    Task<bool> DeleteLessonAsync(HttpContext context, int id);
    
    FullCardResponse AddCard(HttpContext context, CardRequest cardRequest);
    Task<FullCardResponse> AddCardAsync(HttpContext context, CardRequest cardRequest);

    FullCardResponse UpdateCard(HttpContext context, CardRequest cardRequest);
    Task<FullCardResponse> UpdateCardAsync(HttpContext context, CardRequest cardRequest);
    
    bool DeleteCard(HttpContext context, int id);
    Task<bool> DeleteCardAsync(HttpContext context, int id);
    
    QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest);
    Task<QuestionResponse> AddQuestionAsync(HttpContext context, QuestionRequest questionRequest);

    QuestionResponse UpdateQuestion(HttpContext context, QuestionRequest questionRequest);
    Task<QuestionResponse> UpdateQuestionAsync(HttpContext context, QuestionRequest questionRequest);

    bool DeleteQuestion(HttpContext context, int id);
    Task<bool> DeleteQuestionAsync(HttpContext context, int id);
    
    TaskResponse AddTask(HttpContext context, TaskRequest taskRequest);
    Task<TaskResponse> AddTaskAsync(HttpContext context, TaskRequest taskRequest);

    TaskResponse UpdateTask(HttpContext context, TaskRequest taskRequest);
    Task<TaskResponse> UpdateTaskAsync(HttpContext context, TaskRequest taskRequest);
    
    bool DeleteTask(HttpContext context, int id);
    Task<bool> DeleteTaskAsync(HttpContext context, int id);
}
