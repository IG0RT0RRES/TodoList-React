/* eslint-disable no-unused-vars */
class Tarefa {
        constructor(paramId,paramStatus,paramTarefa,paramData,paramModificacao){
        this.Id = paramId;
        this.Status = paramStatus;
        this.Tarefa = paramTarefa;
        this.Data = paramData;
        this.Modificacao = paramModificacao;
        }

        EqualsDate(date){
            return this.Data.Data == date.Data && this.Data.Ano == date.Ano && this.Data.Mes[0] == date.Mes[0] && this.Data.Horas == date.Horas && this.Data.Minutos == date.Minutos && this.Data.Segundos == date.Segundos && this.Data.Dia == date.Dia;
        }

        ToString(){
            return "Id: " + this.Id + 
            ", Tarefa: " + this.Tarefa + 
            ", Criado em: " + this.Data.Data + "/" + this.Data.Mes[0] + "/" + this.Data.Ano + 
            " Modificado em: " + this.Modificacao.Data + "/" + this.Modificacao.Mes[0] + "/" + this.Modificacao.Ano;
        }
}

export default Tarefa