using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ICardManagementService
{
    FullCardResponse GetCardFull(int userId, int cardId);
    Task<FullCardResponse> GetCardFullAsync(int userId, int cardId);
    
    BriefCardResponse GetCardBrief(int id);
    Task<BriefCardResponse> GetCardBriefAsync(int id);
    
    ICollection<BriefCardResponse> GetLessonCards(int id);
    Task<ICollection<BriefCardResponse>> GetLessonCardsAsync(int id);
    
    FullCardResponse AddCard(int userId, CardRequest cardRequest);
    Task<FullCardResponse> AddCardAsync(int userId, CardRequest cardRequest);

    FullCardResponse UpdateCard(int userId, CardRequest cardRequest);
    Task<FullCardResponse> UpdateCardAsync(int userId, CardRequest cardRequest);
    
    bool DeleteCard(int id);
    Task<bool> DeleteCardAsync(int id);
}
