using Crux.Models.Requests;
using Crux.Models.Responses;

namespace Crux.Services;

public interface ICardManagementService
{
    FullCardResponse GetCardFull(HttpContext context, int id);
    Task<FullCardResponse> GetCardFullAsync(HttpContext context, int id);
    
    BriefCardResponse GetCardBrief(HttpContext context, int id);
    Task<BriefCardResponse> GetCardBriefAsync(HttpContext context, int id);
    
    ICollection<BriefCardResponse> GetLessonCards(HttpContext context, int id);
    Task<ICollection<BriefCardResponse>> GetLessonCardsAsync(HttpContext context, int id);
    
    FullCardResponse AddCard(HttpContext context, CardRequest cardRequest);
    Task<FullCardResponse> AddCardAsync(HttpContext context, CardRequest cardRequest);

    FullCardResponse UpdateCard(HttpContext context, CardRequest cardRequest);
    Task<FullCardResponse> UpdateCardAsync(HttpContext context, CardRequest cardRequest);
    
    bool DeleteCard(HttpContext context, int id);
    Task<bool> DeleteCardAsync(HttpContext context, int id);
}
