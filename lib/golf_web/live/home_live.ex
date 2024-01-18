defmodule GolfWeb.HomeLive do
  use GolfWeb, :live_view

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <h2>Golf</h2>

      <button phx-click="create_lobby">
        Create Game
      </button>
    </div>
    """
  end

  @impl true
  def mount(_params, session, socket) do
    user = Golf.Users.get_user_by_session_id(session["session_id"])
    {:ok, assign(socket, page_title: "Home", user: user)}
  end

  @impl true
  def handle_event("create_lobby", _params, socket) do
    id = Golf.gen_id()
    _lobby = Golf.Lobbies.create_lobby(id, socket.assigns.user)
    {:noreply, push_navigate(socket, to: ~p"/lobby/#{id}")}
  end
end
