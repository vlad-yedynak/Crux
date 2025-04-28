using Crux.Models.Requests;
using Crux.Models.Responses;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Services;

public interface ILessonService
{
    [HttpPost]
    LessonResponse AddLesson(HttpContext context, string title);

    [HttpPost]
    CardResponse AddCard(HttpContext context, CardRequest cardRequest);
    
    [HttpPost]
    QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest);

    [HttpGet]
    ICollection<KeyValuePair<int, LessonResponse>> GetLessons(HttpContext context);
}
