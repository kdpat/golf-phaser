defmodule GolfWeb.PageController do
  use GolfWeb, :controller

  def home(conn, _params) do
    render(conn, :home, page_title: "Home", token: get_csrf_token())
  end

  def join_lobby(conn, %{"id" => id}) do
    with id <- String.trim(id) |> String.downcase(),
         {:started, false} <- {:started, Golf.GamesDb.game_exists?(id)},
         lobby <- Golf.Lobbies.get_lobby(id),
         {:exists, true} <- {:exists, is_struct(lobby)},
         user <- conn.assigns.user do
      case Golf.Lobbies.add_lobby_user(lobby, user) do
        {:ok, lobby} ->
          Golf.broadcast!("lobby:#{id}", {:user_joined, lobby, user})

          conn
          |> put_flash(:info, "Joined lobby #{id}.")
          |> redirect(to: ~p"/lobby/#{id}")

        _ ->
          redirect(conn, to: ~p"/lobby/#{id}")
      end
    else
      {:started, _} ->
        conn
        |> put_flash(:error, "Game #{id} already started.")
        |> redirect(to: ~p"/")

      {:exists, _} ->
        conn
        |> put_flash(:error, "Game #{id} not found")
        |> redirect(to: ~p"/")

      _ ->
        redirect(conn, to: ~p"/")
    end
  end
end
