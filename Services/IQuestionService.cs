using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IQuestionService
{
    QuestionResponse AddQuestion(HttpContext context, QuestionRequest questionRequest);
    Task<QuestionResponse> AddQuestionAsync(HttpContext context, QuestionRequest questionRequest);

    QuestionResponse UpdateQuestion(HttpContext context, QuestionRequest questionRequest);
    Task<QuestionResponse> UpdateQuestionAsync(HttpContext context, QuestionRequest questionRequest);
    
    ICollection<QuestionResponse> GetQuestions(int userId, int cardId);
    Task<ICollection<QuestionResponse>> GetQuestionsAsync(int userId, int cardId);

    bool DeleteQuestion(HttpContext context, int id);
    Task<bool> DeleteQuestionAsync(HttpContext context, int id);
}
