using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface IQuestionService
{
    QuestionResponse AddQuestion(QuestionRequest questionRequest);
    Task<QuestionResponse> AddQuestionAsync(QuestionRequest questionRequest);

    QuestionResponse UpdateQuestion(QuestionRequest questionRequest);
    Task<QuestionResponse> UpdateQuestionAsync(QuestionRequest questionRequest);
    
    ICollection<QuestionResponse> GetQuestions(int userId, int cardId);
    Task<ICollection<QuestionResponse>> GetQuestionsAsync(int userId, int cardId);

    bool DeleteQuestion(int id);
    Task<bool> DeleteQuestionAsync(int id);
}
