
import React, { useState, useEffect } from "react";
import { Recipe } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users, 
  ChefHat, 
  Star, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Share2,
  Play
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SocialShareCard from "../components/community/SocialShareCard";
import { toast } from "sonner"; // Importar toast

export default function ViewRecipe() {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRecipe = async () => { // Renamed from fetchRecipe
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');
        
        if (!recipeId) {
          setError('ID de receta no encontrado');
          setIsLoading(false);
          return;
        }

        const recipeData = await Recipe.filter({ id: recipeId }); // Changed from Recipe.get(recipeId)
        
        if (recipeData.length === 0) {
          setError('Receta no encontrada');
          setIsLoading(false); // Ensure loading is set to false even if not found
          return;
        } else {
          const data = recipeData[0];
          setRecipe(data);

          // Añadir meta tags para redes sociales (preserved existing functionality)
          if (data) {
            document.title = `${data.title} - DespensaIA`;
            
            // Meta tags Open Graph
            const updateMetaTag = (property, content) => {
              let element = document.querySelector(`meta[property="${property}"]`);
              if (!element) {
                element = document.createElement('meta');
                element.setAttribute('property', property);
                document.head.appendChild(element);
              }
              element.setAttribute('content', content);
            };

            updateMetaTag('og:title', data.title);
            updateMetaTag('og:description', data.description || 'Deliciosa receta en DespensaIA');
            updateMetaTag('og:image', data.image_url || '/default-recipe-image.jpg');
            updateMetaTag('og:url', window.location.href);
            updateMetaTag('og:type', 'article');
            updateMetaTag('og:site_name', 'DespensaIA');
            
            // Twitter Cards
            const updateTwitterTag = (name, content) => {
              let element = document.querySelector(`meta[name="${name}"]`);
              if (!element) {
                element = document.createElement('meta');
                element.setAttribute('name', name);
                document.head.appendChild(element);
              }
              element.setAttribute('content', content);
            };

            updateTwitterTag('twitter:card', 'summary_large_image');
            updateTwitterTag('twitter:title', data.title);
            updateTwitterTag('twitter:description', data.description || 'Deliciosa receta en DespensaIA');
            updateTwitterTag('twitter:image', data.image_url || '/default-recipe-image.jpg');
          }
        }
      } catch (e) {
        console.error('Error loading recipe:', e); // Updated error message
        setError('Error cargando la receta'); // Updated error message
      }
      setIsLoading(false);
    };

    loadRecipe();
  }, []);

  const handleShare = async () => {
    if (!recipe) return;

    const shareUrl = window.location.href;
    const shareData = {
      title: `Receta: ${recipe.title}`,
      text: `¡Mira esta deliciosa receta que encontré en DespensaIA: ${recipe.title}!`,
      url: shareUrl,
    };

    const fallbackShare = () => {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace de la receta copiado al portapapeles");
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name === 'AbortError') { // Corrected handling for AbortError
          return; // User cancelled share, do nothing
        }
        // For other errors, use fallback
        console.error("Error con la API de compartir, usando fallback:", err);
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const getYouTubeVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando receta...</div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" /> {/* Added AlertCircle for better UX */}
        <p className="text-red-500 font-semibold text-lg">{error}</p>
        <Link to={createPageUrl("CommunityRecipes")}>
            <Button variant="link" className="mt-4">Volver a la comunidad</Button>
        </Link>
    </div>;
  }

  if (!recipe) return null; // Should not happen if error handling is correct, but good as a safeguard

  const youtubeVideoId = recipe.video_url ? getYouTubeVideoId(recipe.video_url) : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
            <Link to={createPageUrl("CommunityRecipes")}>
                <Button variant="ghost" className="text-gray-600">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Volver a la Comunidad
                </Button>
            </Link>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Media Principal: Video priorizado sobre imagen */}
            {(recipe.video_url || recipe.image_url) && (
              <div className="relative h-64 md:h-80 overflow-hidden">
                {recipe.video_url ? (
                  <>
                    {youtubeVideoId ? (
                      <div className="absolute inset-0">
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                          title="Video de la receta"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <a
                          href={recipe.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Play className="w-5 h-5" />
                          Ver Video
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  )
                )}
              </div>
            )}

            <div className="p-6 md:p-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{recipe.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            <span>Por {recipe.created_by?.split('@')[0] || 'Usuario'}</span>
                            <span>{format(new Date(recipe.created_date), "d MMMM yyyy", { locale: es })}</span>
                            {recipe.is_ai_generated && (
                                <Badge className="bg-purple-100 text-purple-800"><Sparkles className="w-3 h-3 mr-1" />Generada por IA</Badge>
                            )}
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartir
                    </Button>
                </div>

                {/* Description */}
                <p className="text-gray-700 leading-relaxed text-lg mb-6">{recipe.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm flex-wrap mb-8 p-4 bg-gray-50 rounded-lg">
                    {recipe.prep_time && <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" /><span><strong>Prep:</strong> {recipe.prep_time} min</span></div>}
                    {recipe.cook_time && <div className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-orange-500" /><span><strong>Cocción:</strong> {recipe.cook_time} min</span></div>}
                    {recipe.servings && <div className="flex items-center gap-2"><Users className="w-5 h-5 text-green-500" /><span><strong>Porciones:</strong> {recipe.servings}</span></div>}
                    {recipe.rating_average > 0 && <div className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /><span><strong>{recipe.rating_average.toFixed(1)}</strong> ({recipe.rating_count} reseñas)</span></div>}
                    {recipe.calories_per_serving && <div className="flex items-center gap-2">🔥 <span><strong>Calorías:</strong> {recipe.calories_per_serving}/porción</span></div>}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Ingredients */}
                    <div className="md:col-span-1 space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 border-b pb-2">🥘 Ingredientes</h3>
                        <div className="space-y-2">
                            {recipe.ingredients.map((ing, i) => (
                                <div key={i} className="flex gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <p><span className="font-medium">{ing.quantity}</span> {ing.name}{ing.optional && <span className="text-gray-500 text-xs"> (opcional)</span>}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="md:col-span-2 space-y-4">
                         <h3 className="text-xl font-bold text-gray-900 border-b pb-2">👨‍🍳 Instrucciones</h3>
                        <div className="space-y-4">
                            {recipe.instructions.map((step, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">{index + 1}</div>
                                    <p className="text-gray-700 leading-relaxed">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">Etiquetas</h4>
                    <div className="flex flex-wrap gap-2">
                      {recipe.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
        </div>
